# 06 — Metrics

All figures come from the runner DB, `outcomes.jsonl`, venture repos or PostHog — never from an agent's summary. The Monday page quotes them verbatim.

## Success metrics
| Metric | Target | How measured |
|---|---|---|
| v2 build done | J29 passes ≤3 weeks after J01 starts | Runner: date of first J01 row → J29 `done` |
| Live venture proof (M1) | Problem-validated ≤6 weeks after J29 | `venture.yml` stage change + ≥10 transcripts in `company/customers/` |
| Conversations per venture in discovery | ≥5/week | Count of transcript files by week |
| Idea → live fake door | ≤1 day | Runner: first job on venture → publish approval executed |
| Time to first paying customer | Named per venture in `venture.yml`; default ≤90 days from Solution-validated | Stripe payment event |
| Founder system overhead | ≤6 h/week (calls excluded) | Founder logs 3 numbers on Friday (Monday page, inbox, review minutes); runner logs interactive session hours |
| Decisions per day | ≤10; expired-unanswered <20% | Inbox table |
| Merged, gate-passed changes per active venture | ≥5/week | GitHub + `.qa/verdicts` |
| Cost per shipped change | Report % of 5-hour window per merged change; trend down | ccusage estimate ÷ merged PRs |
| Automation share of window | Peak ≤60% | Runner capacity log |
| First-pass gate PASS rate | ≥70% | `.qa/verdicts` + runner |
| Partial + unresolved rate | <15% of jobs/day (breaker at 30%) | Runner |
| False "done" on canaries | 0 | Nightly canary results |
| Second-family coverage | 100% of irreversible-tier merges carry a non-empty Codex verdict | Verdict records |
| Harness vs venture split (after the build) | Harness ≤20% of jobs and founder hours | `harness-ratio` over `kind` field |
| Context budget | `CLAUDE.md` ≤8 KB; every pack ≤40 KB; `status --brief` ≤2 KB | CI step; loader manifest |
| Experiments with predeclared kill line | 100% | `check-venture.mjs` |
| Unapproved outbound or money actions | 0 | Gate logs vs send/Stripe logs |

## Drift alarms (weekly, on the Monday page)
A move of **≥20% week on week** in any alarm pauses the improvement loop and any autonomy promotion until the founder clears it.

| Alarm | Source |
|---|---|
| First-pass gate PASS rate | Verdicts |
| Founder edit/reject rate on agent output, and approval-without-edit rate (shown, not a label) | Inbox + `outcomes.jsonl` |
| Rework within 14 days | `outcomes.jsonl` (same files touched again) |
| Turns and window-% per job | Runner |
| Ledger `would_block` count | `node scripts/ledger.mjs verify` |
| Harness-ratio above 20% two weeks running | Runner |
| Retrieval golden-set score <85% (per venture, when the set exists) | J18 |
| Any venture with no *did*-level evidence for 3 weeks → auto-park proposal | `venture.yml` + transcripts |
