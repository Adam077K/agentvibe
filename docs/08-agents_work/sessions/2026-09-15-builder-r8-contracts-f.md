---
date: 2026-09-15
role: builder
task: r8-contracts-f
qa_verdict: PASS
tier: full
---
HEAD was RED at `ffeb072` (`F6X-03`, a synthetic id quoted by a verbatim archive). Settled structurally, branch (a): the Step 6 per-id demand is over the ids a review RAISES; mentions are still swept, floored and reported, and the mention-only difference is declared in `#/step6_mention_only` and checked to be exactly that difference.
Landed: item 0 (the raised/mentioned split, R37) · item 1 (`FINDING_SOURCE_FLOOR`'s assertion moved after the sweep, so r36 is refused by the check it exists to exercise — measured `wrong_reason` before, `rejected` after) · item 2 (F6AA family into the sweep, 11 rows, all constants restated to the value each holds, F6Y-01 crossed over, R38) · item 4a (F6Y-07, F6Y-08, R39) · item 5 (F6Y-05 contracts half) · item 4b data half (nine dead fixture citations).
F6AA-08/09/10 landed inside items 0–2 rather than as an "item 3" commit; recorded in `planning/F2/10-repair-names-contracts-f.md`.
NOT LANDED, with reasons and cures in that same file: F6Y-02 (not attempted — turn budget; its defect is live and unguarded) and the CHECK half of F6Y-06 (structural — the scratch tree carries the MANIFESTs and not the fixture bodies, so the check cannot be fixtured without changing the runner's tree construction). F6Y-05's chapter half is a prose lane's.
Light validator `CONTRACTS_FIXTURE_RUN=1 python3 validate_contracts.py` exit 0 after every item; 115 negative / 76 positive declared. Fourteen fixtures EXECUTED individually, verdicts in the commits; the full suites were NOT run by this lane.
A real regression was found by executing, not by reading: `r19-pin-citing-a-review-finding-deleted-benign` froze a 36-key snapshot of `#/not_answered` and was rejected once this lane grew the table; regenerated from the committed table.
Author-recorded pending independent recheck. One model family, no second opinion. No runtime of any kind exists.
