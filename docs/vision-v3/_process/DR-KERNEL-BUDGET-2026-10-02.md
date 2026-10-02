# DR-KERNEL-BUDGET: Kernel line budget raised to 10,000; the checker no longer counts itself (2026-10-02)

**Basis.** Founder decision, 2026-10-02, taken by AskUserQuestion: the Kernel line budget is **10,000**
non-test Go lines, and the boundary checker's own packages, `kernel/internal/boundary` and
`kernel/cmd/avk-boundary`, are not counted. 09a §2 already marks the cap as a parameter ("~8,000 lines
(parameter)", `09a-ENGINEERING.md:65` before this change), and `R6-REVIEW-opus.md:165` asked for it to be
re-set from measured size.

**Why now.** `origin/main` at `76ca095` failed `avk-boundary`: 8,318 lines against 8,000, after #158–#161
merged. Each of those PRs passed on its own. The launcher (B1-08), the codex adapter (B1-07) and B1-12b are
still to come.

## What changed

- `kernel/internal/boundary/size.go`: `DefaultMaxLines` 8000 → 10000. `CountLines` skips a `.go` file whose
  directory, relative to the kernel root, is **exactly** `internal/boundary` or `cmd/avk-boundary`. It uses
  no prefix, suffix or glob. Their subdirectories are still counted, including the Journal fixtures under
  `internal/boundary/testdata`. So is every near-miss (`internal/boundaryx`, `x/internal/boundary`,
  `cmd/avk-boundary-extra`).
- `kernel/internal/boundary/size_test.go`: pins 10,000 passing and 10,001 failing, the exclusion, and the
  near-misses. It kills five mutants: substring match, prefix match, no exclusion, a default of 10,001, and
  `>=` at the edge.
- Canon: `14-BUILD-PLAN.md` G1 (d), the B0-16 row and the "Kernel stays small" row; `09a-ENGINEERING.md`
  §2; `build/jobs.yml` B0-16 title; `kernel/README.md`.

**Measured after the change:** `go run ./cmd/avk-boundary` → `7402 of 10000 lines`.

**Not changed.** Historical records keep the figure they stated at the time: `R6-REVIEW-opus.md` and the
B0-16 session file. No done-test register pins the budget or the counted set.
`node build/check-done-tests.mjs` reported 64 hashes across 7 registers, all matching.
