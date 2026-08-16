---
role: builder
task: ledger-blind-spots
date: 2026-08-16
qa_verdict: PASS
tier: full
issues: [57, 58, 59]
---

- Three defects, one shape: two implementations of a concept, only one carrying the check. Fixed together.
- #57 `sweep` dropped global claims in silence on a runner. `globalAbsenceNotice()` is now the single copy of the sentence `verify` already had; the header states the project/global split, `status` is PARTIAL when either the log or the global ledger is missing, and neither absence is counted as a finding.
- #58 the global YAML accepted a duplicate id because a closed per-entry schema cannot see between entries. `globalClaimLines()` returns every hit instead of discarding them; lint fails naming both line numbers, once per collision.
- #59 new deterministic prose→claim citation check inside `lint`: 81 citations over 37 files. Fences and frontmatter are definition sites, `<!-- ledger:unregistered: why -->` is the greppable escape (7 in tree), and a marker that suppresses nothing is reported as stale.
- Residual, declared not hidden: without `~/.warroom/ledger/global.yml` a dead id and a global one are indistinguishable, so on a runner those 19 citations are reported unchecked rather than failed. Closing that needs a decision this PR does not make.
- Failures constructed for all three before believing any fix; 88 ledger tests pass (76 before). `npm run check` green.
