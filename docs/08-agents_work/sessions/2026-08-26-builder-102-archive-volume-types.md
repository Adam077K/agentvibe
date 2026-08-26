---
date: 2026-08-26
role: builder
task: 102-archive-volume-types
qa_verdict: PASS
tier: full
engines: [builder]
claims_touched: []
---

# `ARCHIVE_VOLUME_RE` matches a name, and a name is not a file

**The defect this PR's own `archiveVolumes()` carried.** Matching names went straight to
`readFileSync`. Re-measured on this base (`c4de767`), one bad entry per constructed tree: a
**directory** → `EISDIR` with a raw stack trace, exit 1 in 36 ms; a **dangling symlink** → `ENOENT`,
likewise; a **FIFO** → **exit 142 at 8,009 ms**, killed by an 8-second cap having printed nothing at
all about the volume. `check:memory` blocks in CI, where a crash names itself and a hang reads as a
slow build.

**Only the scan question exists here, so one predicate answers it.** Established by reading the
file, not inherited from `scripts/evict-memory.mjs`: this script creates nothing — no
`writeFileSync`, `appendFileSync`, `mkdirSync`, `renameSync`, `rmSync`, `unlinkSync` or `openSync` —
so "is this path free to create?", the question that must *not* resolve symlinks, is never asked
here. The question it does ask must resolve, so `statSync`. Two controls pin that and go red under
`lstatSync`.

**Nothing is newly skipped; one row narrows.** A matching entry that is not a regular file now
**fails by name** rather than being skipped — skipping would put a volume beyond the cap according
to how somebody named a directory. Crash rows now check *more* than before, because a crash
abandoned the rest of the scan. The single behaviour change beyond crash-to-refusal: a symlink to a
character device (`/dev/null`) previously read as `0 bytes` and **passed**, and is now refused.
Measured on both versions at this base. `ARCHIVE_VOLUME_RE` is untouched — still broad, still
case-insensitive.

**Verification, all re-run against `c4de767` rather than carried forward.** `29 tests · 29 pass ·
0 fail`. Against this base's unpatched script the new cases are `25 pass · 4 fail`, the FIFO case
hitting the cap at 8,006 ms. Under `lstatSync`, **both symlink controls go red**. FIFO refusal:
8,009 ms → 36 ms. `npm run check`: `Tally: 44 of 44 passed`.

**Carried in with the fix:** the test helper's `JSON.parse(r.out)` had no emptiness check — the
third instance in this repo of the shape found on #99, and it belongs with the change that drives
crash paths through it.

**Figures.** This change adds no script and no CI step, so `STEPS.length` stays **44**, `npm run
check` stays **44 of 44**, and `check-suite.test.mjs`'s denominators re-derive to **72** and **45**
unchanged. `docs/STATUS.md` is therefore not falsified and was not touched.

**Residual, flagged not fixed (lead decision).** A TOCTOU window remains between `statSync` and
`readFileSync`; the same window exists in `scripts/evict-memory.mjs`. Raised rather than decided.
