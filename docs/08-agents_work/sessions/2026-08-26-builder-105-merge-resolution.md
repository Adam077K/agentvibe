---
date: 2026-08-26
role: builder
task: 105-merge-resolution
qa_verdict: PASS
tier: full
engines: [builder]
claims_touched: []
---

# Two fixes for one defect class, at sites neither one reached

**Neither side was a superset, and it is measured rather than argued.** A FIFO at
`.claude/memory/DECISIONS.md`: `origin/main` **hangs — exit 142 at 8,033 ms**; this branch refuses
in 31 ms. A FIFO named `DECISIONS_ARCHIVE_004.md`: this branch **passes at exit 0**, never scanning
it, so an uncapped volume goes unchecked; `main` refuses in 37 ms. The merged file refuses both, in
27 ms and 34 ms. Taking either side verbatim loses a real fix.

**Four commits touched these files on `main`, not one.** `bcab53b`, `2ce235b`, `4c08950` (the volume
scan) and `99bed21` (its type filter). The conflict set was exactly the two files, verified rather
than inherited.

**One predicate, not two.** Both sides had added the same type check under different names —
`volumeKind` on `main`, `fileKind` here. Two implementations of one question is the failure this
repo names most often, so the merge keeps one, renamed `entryKind` because it is now asked about
`DECISIONS.md` and `LONG-TERM.md` as well as about volumes. The evidence that this is real and not
cosmetic: the `statSync`→`lstatSync` mutation now turns **all four** symlink controls red, where
each parent could only redden its own two.

**One test dropped, and why.** `the OPTIONAL archive path is type-checked too` tested
`loadMemoryFile(..., { required: false })`. That call site no longer exists: on `main` the volume
scan replaced the fixed-path archive check, `ARCHIVE_VOLUME_RE` matches `DECISIONS_ARCHIVE.md`
itself, and `main`'s own FIFO-volume test covers it. Both remaining `loadMemoryFile` calls are
`required: true`. The test was removed rather than left asserting a path that is gone.

**Verification against the merged result, not either parent.** `35 tests · 35 pass · 0 fail`
(29 from `main` + 6 kept from here). Mutation: `30 pass · 5 fail`, the four symlink controls plus
the dangling case. `npm run check`: `Tally: 44 of 44 passed`, denominator derived from
`STEPS.length`, not carried.

**One failure that was not a defect.** `test:registration` failed once with "the copy tracks a
different set of files" — the two paths appeared three times in `git ls-files` because the index
still held unmerged stages 1/2/3. Staging the resolution cleared it. Recorded because a mid-merge
index producing a *content* assertion failure is not an obvious symptom.

**Residual, unchanged and still not fixed:** the TOCTOU window between `entryKind` and
`readFileSync`, present at both sites and in `scripts/evict-memory.mjs`.
