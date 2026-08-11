---
date: 2026-08-11
role: ceo
task: phase-3-dispositions
tier: irreversible
qa_verdict: PASS
status: Complete
---

# Session Log: CEO — Closing the hole Phase 3 left

Phase 3 shipped `valid_until` without the disposition mechanism ADR-001 specifies, and shipped shadow mode
with no promotion criterion and no review date. Both are mine, and both are the same defect: a deadline
nobody has to answer.

**Dispositions.** Refresh / Deprecate / Waive, closed sub-schema. `waive` requires a date — an open-ended
waiver is the claim being switched off, which is what expiry exists to prevent. A **lapsed** waiver fails
harder than no disposition at all, because somebody promised to come back and did not. `refresh` deliberately
does *not* short-circuit the resolver: saying you renewed the evidence is not the same as it passing, and
only one of those is checkable.

**The shadow window now books its own review.** `c-shadow-window-open` carries `valid_until: 2026-09-08`; on
that date `claim-freshness` fails it and the only way to clear it is to record a disposition. No scheduler
was built. The per-resolver promotion criteria are written down in
[CLAIM-LEDGER.md](../../03-system-design/CLAIM-LEDGER.md) — including that `claim-source` is **not**
promotable on this evidence, because it needs the network.

**`ledger events`** reads the run log, which nothing did — stop condition 2 starting its clock. It already
paid for itself: `claim-command`'s four historical would_blocks are all from bugs fixed during the build, and
`claim-freshness` / `claim-source` fire only on the canary.

`c-runtime-nested-spawn` is **waived to 2026-09-08** — refreshing it means re-probing, which needs subagent
spawning, disabled by founder instruction. That is what waive is for, and it is the mechanism's first real
use.

Memory-file collapse assigned to **Phase 6**, whose gate now includes proving the migration non-lossy.

**QA verdict basis:** no independent QA-Lead — subagent spawning is off. PASS rests on 111 tests and
`npm run check` exit 0.

---

*Session by: ceo | 2026-08-11*
