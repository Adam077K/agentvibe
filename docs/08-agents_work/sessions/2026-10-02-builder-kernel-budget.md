---
date: 2026-10-02
engine: builder
task: kernel-budget
branch: fix/kernel-budget
qa_verdict: PENDING
tier: lite
---
Founder decision 2026-10-02: the Kernel budget is 10,000 lines, and the checker packages `internal/boundary` and `cmd/avk-boundary` are excluded by exact directory, so their subdirectories and testdata still count. `origin/main` @ 76ca095 measured 8,318 of 8,000 and failed. This branch measures 7,402 of 10,000 and passes.
Nothing was frozen: no done-test register names a boundary file, and `check-done-tests` reports 64 hashes across 7 registers, all matching. The new `size_test.go` kills 5 of 5 mutants.
Canon updated: 09a §2, three 14-BUILD-PLAN rows, the B0-16 title in `build/jobs.yml` and `kernel/README.md`. The decision is recorded in `docs/vision-v3/_process/DR-KERNEL-BUDGET-2026-10-02.md`.
Verified: `go run ./cmd/avk-boundary` exits 0; `go test ./...` exits 0; `check-done-tests` exits 0; `check:citations-exist` exits 0.
The first suite run failed `lease.TestRaceIsDecidedInStorage` ("race never reached storage"). The change does not touch that package. It passed 6 of 6 times in isolation and passed on the full rerun, so it is a flake that depends on scheduling under load.
Tier: `classify.mjs` gives floor=lite (`kernel/**` → null/default; docs → trivial).
