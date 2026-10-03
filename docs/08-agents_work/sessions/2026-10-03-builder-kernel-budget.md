---
date: 2026-10-03
engine: builder
task: kernel-budget
branch: chore/kernel-budget-15000
qa_verdict: FOUNDER-APPROVED-NO-REVIEW
tier: trivial
---
Kernel line budget raised from 11,000 to 15,000 on the founder's 2026-10-03 ruling. No review round, by the founder's instruction.
Changed: `DefaultMaxLines` in `kernel/internal/boundary/size.go` (comment cites DR-KERNEL-BUDGET-2026-10-02 and the ruling); usage doc in `kernel/cmd/avk-boundary/main.go`; `kernel/README.md`; `build/jobs.yml` title; "Amendment 2026-10-03" appended to the DR.
`size_test.go` pins the default, so it moved to 15,000 (test renamed `TestDefaultBudgetIsFifteenThousand`). `build/done-tests/B1-07.yml` mentions 11,000 only in a history comment, not as a pin, and is untouched. No workflow runs `avk-boundary` or passes `-max-lines`.
Verified: `go test -count=1 ./internal/boundary/ ./cmd/avk-boundary/...` ok on both; `go run ./cmd/avk-boundary` exit 0, 9615 of 15000 lines (origin/main at f2ed126).
