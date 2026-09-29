# F2-07 repair pass: outcome and build backlog (2026-09-29)

One review pass (reviewer, single model family): **PASS, no P1.** Light validator exit 0, 305,749 checks; generator `--check` clean.
Per founder rule (2026-09-29) no recheck chain: every item below is fixed inside the construction batch that implements the record.

| Finding | Closed | Backlog item | Batch |
|---|---|---|---|
| F7-database-01 (BLOCKER) | yes | Confirm no command creates DeletionScope directly in `determined` (not examined) | B01 |
| F7-database-02 | partial | Machine-check receipt applicability across revisions; give *retained* inventory items a phase so retention-only `verified_with_residuals` is reachable | B01 |
| F7-privacy-01 | yes | — | — |
| F7-distributed-01 | yes | — | — |
| F7-accountant-01 | partial | Compute per-currency debit=credit (journal_balance primitive) instead of attesting; add paired positive/negative controls | B05 (IC-BOOKS) |
| F7-cfo-01 | partial | Refund amount/currency field on Fulfillment; bind Reservation release rule itself to settled refund | B05 (IC-PAY) |
| F7-insurer-successor-01 | yes | Refresh stale `requires` text on both ContinuityArrangement criteria | B06 |
| F7-insurer-successor-02 | partial | Add residual-duty conjuncts via `tools/phase_content.py` and regenerate | B06 |
| F7-orchestrator-01 | yes | — | — |
| F7-economist-02 | yes | — | — |
| F7-philosopher-01 | partial | Ch.05 header line 3 still says unanswered | next doc touch |
| F7-backend-03 | yes (prose) | `implementation-graph.json#/stages` B01 row not synced | B00 |

Remaining 20 MEDIUM findings and 67 unspecified phase criteria: resolved in the batch that implements the affected record.
