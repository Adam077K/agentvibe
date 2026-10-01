---
role: builder
task: label-reconcile
branch: docs/label-reconcile
tier: trivial
qa_verdict: PENDING
---
Docs only, per DR-68: 06 §4 `type Label` now uses exactly 09a §12 `LabelV1`; the 06 and 09b examples are rewritten to wire names. 09a gains `SourceRef` and `PrincipalRef` plus a "06 → wire" note.
Decision note: docs/vision-v3/_process/DR-LABEL-RECONCILE-2026-10-01.md. It holds every mapping with a line citation and seven OPEN items. After the review FAIL at cc5ce9f, worker→internal and data_only→none moved to OPEN, and HumanTask→counterparty was narrowed to the broker case.
Tier `trivial` comes from `node scripts/classify.mjs` on all 5 paths. No verdict and no PR yet.
