# DR-KERNEL-BUDGET: Kernel line budget raised to 11,000, nothing excluded (2026-10-02, revised 2026-10-03)

**Ruling in force.** The budget is raised to 11,000 and nothing is excluded. Founder, 2026-10-03, superseding
the 2026-10-02 exclude-and-10k ruling. Every non-test Go line under `kernel/` counts, including the boundary
checker's own packages, `kernel/internal/boundary` and `kernel/cmd/avk-boundary`. The counted set is identical
to `origin/main`'s.

**Superseded ruling, kept for provenance.** On 2026-10-02 the founder ruled, by AskUserQuestion, for a 10,000
budget with the checker packages excluded by directory. The review of that change found a loophole and passed
it with a MED finding: Kernel code planted in `package boundary` and imported by a Kernel package would run
while its lines went uncounted. The 2026-10-03 clarification removes the exclusion, so the loophole does not
exist. 11,000 keeps the headroom approved on 2026-10-02, 2,682 lines over the measured 8,318.

**Basis.** 09a §2 marks the cap as a parameter ("~8,000 lines (parameter)" at `09a-ENGINEERING.md:65` before
this change). `R6-REVIEW-opus.md:165` asked for it to be re-set from measured size.

**Why.** `origin/main` at `76ca095` failed `avk-boundary` at 8,318 lines against 8,000, after #158–#161
merged. Each of those PRs passed on its own. The launcher (B1-08), the codex adapter (B1-07) and B1-12b are
still to come.

## What changed

- `kernel/internal/boundary/size.go`: `DefaultMaxLines` 8000 → 11000. Nothing else changes; the counted set
  is the same.
- `kernel/internal/boundary/size_test.go` pins three things: 11,000 passes, 11,001 fails, and a file in a
  checker package counts.
- Canon: `14-BUILD-PLAN.md` G1 (d), the B0-16 row and the "Kernel stays small" row; `09a-ENGINEERING.md` §2;
  the B0-16 title in `build/jobs.yml`; `kernel/README.md`.
- The "Kernel stays small" row said "CI fails the 8,001st line". No workflow runs `avk-boundary` yet; #144
  wires that. The row now says `avk-boundary` fails the 11,001st line and is not yet run by CI. The risk row
  "The Kernel sprawls past its trust budget" said "CI fails at 8,001 lines" and is corrected the same way.

**Measured after the change:** `go run ./cmd/avk-boundary` → `8318 of 11000 lines`.

**Not changed.** Historical records keep the figure they stated at the time: `R6-REVIEW-opus.md` and the
B0-16 session file. No done-test register pins the budget or the counted set.
