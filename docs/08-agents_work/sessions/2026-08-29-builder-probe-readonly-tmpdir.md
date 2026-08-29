---
date: 2026-08-29
role: builder
task: probe-readonly-tmpdir
qa_verdict: PASS
tier: full
risk: full
branch: integration/design-layer
---

# `test:probe-readonly` stops depending on the ambient TMPDIR

`scripts/probe-readonly.test.mjs` based its fixture root at `os.tmpdir()`. Under the armed sandbox the
macOS default (`/var/folders/.../T`) is not writable, so `fs.mkdtempSync` threw `EPERM` inside
`freshTmpdir()` — **before any case reached an assertion**. All 32 died, and so did the step carrying
them. The base is the repo root now, which is where `scripts/lenses.test.mjs` has always written
`.lens-fixture-*.yml` and where `scripts/design-probe.test.mjs` — the other half of this same step —
was moved earlier the same day.

## Measured, four cells, `$?` read directly with output redirected to a file, never through a pipe

| Cell | | before | after |
|---|---|---|---|
| A `TMPDIR=/tmp/claude-501` | file | 32 pass · 0 fail · **exit 0** | 32 pass · 0 fail · **exit 0** |
| B `TMPDIR=/var/folders/…/T/` | file | **0 pass · 32 fail · exit 1** · 64 `EPERM` lines | 32 pass · 0 fail · **exit 0** · **0** `EPERM` |
| A | step `test:probe-readonly` | 122 pass · 0 fail · **exit 0** | 122 pass · 0 fail · **exit 0** |
| B | step `test:probe-readonly` | **90 pass · 32 fail · exit 1** | 122 pass · 0 fail · **exit 0** |

Cell B's step is the sharpest statement of the defect: **90 and 32 are the two files.**
`design-probe.test.mjs` passed all 90 and `probe-readonly.test.mjs` failed all 32, inside one step —
so the step disagreed with itself about where a fixture may live.

## Mutation — reversal goes red, and the control stays green

Put both the `os` import and the `os.tmpdir()` base back, so the **only** variable is the fixture root:

```
cell A (control)  32 pass · 0 fail · exit 0   <- unchanged, so the mutation is not a syntax break
cell B            0 pass · 32 fail · exit 1   <- 64 EPERM lines, the original failure exactly
```

The mutated cell B fails on `EPERM: operation not permitted, mkdtemp` and **not** on a
`ReferenceError` — checked explicitly, because restoring the base without the import would have gone
red for the wrong reason and scored as caught. Restoration was verified by **sha256, not by eyeballing
a diff**: `df23e3b8dcee153dc8346733f987d04b3c0788f49bf7b1c8c9f27f0ea4c1a925` before and after.

## Cleanup is part of the fix, not housekeeping

A leftover under the OS temp root is a stale directory the OS reclaims. A leftover at the repo root is
a **dirty working tree**. Every directory `freshTmpdir()` hands out is tracked and removed by one
`after` hook — centrally rather than at each call site as `design-probe.test.mjs` does, because 12 of
the call sites sit inside loops and a per-caller remove leaks precisely when the test it belongs to is
the one that fails. Zero `.probe-readonly-tmp-*` directories survived any run, including the mutated
one.

## Scope: one file, and the 22 others are deliberately untouched

This fixes **one** file for one reason — `test:probe-readonly` is the step this branch extended, and it
was internally inconsistent. Cell B's suite goes **25 of 48 → 26 of 48**. That is not green, and must
not be read as green: **~24 other test files** base fixtures at `os.tmpdir()` and are pre-existing,
untouched by this branch. Repo-wide, it is a harness defect this work surfaced rather than caused, and
the remaining ~22 failures are a separate decision.

`scripts/lib/check-suite.js` and `.github/workflows/**` are byte-identical to `origin/main`
(`git diff origin/main --` returns empty for both). No new governed script name; no shared helper; no
dependency; `scripts/lib/**` untouched.

## `npm run check` — three runs, three tree states, and NOT ONE of them met the stability rule

| # | HEAD before → after | `git status` before → after | Tally |
|---|---|---|---|
| 1 | `534fd8a` → `534fd8a` | 1 line → **4** | 48 of 48 · exit 0 |
| 2 | `534fd8a` → **`5cafbcb`** | 5 lines → 2 | 48 of 48 · exit 0 |
| 3 | `5cafbcb` → `5cafbcb` | 2 lines → **4** | 48 of 48 · exit 0 |

**Stated plainly rather than rounded up to a clean run:** the discipline is to discard a result if HEAD
or `git status` moved across it, and by that rule all three are void individually. Another lane was
writing `design/system/type.md`, `docs/03-system-design/DESIGN-CAPABILITY.md` and `scripts/verdict.mjs`
into this shared tree throughout, and committed them as `5cafbcb` during run 2.

What the three **together** support is narrower than any one of them would have: the suite is
`48 of 48 · 0 failed · exit 0` with this change present, across three different states of the rest of
the tree. That is evidence of insensitivity to that churn, not a byte-stable measurement, and it is
worth less than one clean run would have been.

The foreign files were left exactly as found — none is in this commit, and none was reverted or
stashed. `scripts/probe-readonly.test.mjs` was verified byte-identical (`sha256 df23e3b8…`) after that
lane's commit landed, so its work and mine never overlapped.

**The four cell measurements above are not affected by any of this.** Each was taken with
`git status --porcelain` at exactly one line — this file — verified before and after, and HEAD
unmoved.
