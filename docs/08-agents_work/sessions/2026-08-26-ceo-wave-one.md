---
date: 2026-08-26
role: orchestrator
task: wave-one
qa_verdict: PASS
tier: trivial
risk: trivial
branch: docs/wave-one-closeout
---

# Wave one — nine PRs, `47dbbd6` → `d1294a4`, and thirteen refutations of the orchestrator

**The PASS is self-recorded, and that is not the tier being met.** All nine PRs of this wave are
author-recorded against a deterministic floor, one agent, one model family. `irreversible` asks for
2-of-3 multi-judge and ≥2 distinct model families; neither is met. *The checks ran and are green* is
not *the tier was satisfied*. Accepted risk, exit condition 2026-11-17.

**Tier of this record.** `node scripts/classify.mjs` on the three paths it touches returns
`floor=trivial`. The classifier was asked, not me — two tiers I assigned this week were wrong.

## Decisions taken — founder, 2026-08-26. Recorded, not re-litigated

1. **Done = the loop runs itself.** Waves A + B + C. Mission-control surfaces and P1 portability are
   **deferred**.
2. **Proof = harness work only.** "Venture work: not yet" stands. The stated cost: every mechanism
   built here remains untested against work that is not the harness itself.

## What shipped

Nine PRs, #109 through #117, 127 commits. Main CI on `d1294a4`: **57 of 57 steps success, 0 failed,
0 skipped** — 49 suite checks plus 4 setup and 4 post steps, read through the jobs API. 50 verdict
records in `.qa/verdicts/`, every one `PASS`.

## Corrections to my own record — the honest part

- **A55 is RETRACTED.** I measured six *plain* YAML scalars, concluded `parseYamlSubset` was
  spec-conformant, retired a backlog item on that basis, and instructed three lanes on it. The
  defect's actual shape was a **block scalar**, where our parser and real YAML *do* disagree. The
  measurement was of the wrong construct. **The backlog item stands.**
- I told five lanes to **"wait for recovery"** during a GitHub Actions outage. A push during an outage
  never gets a run and GitHub does not replay dropped events, so waiting is precisely what does not
  work.
- I put a **local wall-clock time in a brief** to an agent whose other timestamps were UTC, which
  contributed to a fabricated "3-hour hang".
- **Thirteen refutations of me by lanes, all measured.** One shape recurs: *I measure a real case and
  describe a class.*

## The sentence this wave earned — a lane's, not mine

*Not one of the instrument failures this session was caught by reading.* Every one was caught by a
control that disagreed with an expectation.
