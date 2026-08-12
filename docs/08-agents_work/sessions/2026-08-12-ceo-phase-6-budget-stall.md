---
role: ceo
task: phase-6-budget-stall
date: 2026-08-12
branch: feat/phase-6-budget-stall
tier: irreversible
qa_verdict: PASS
---

**Deliverables 2 and 3 of Phase 6.** A ceiling that fires before the next unit of work, and a stall detector
that escalates instead of looping. Both act on `scripts/lib/usage.js`, which measures spend from the session
transcripts rather than from Claude Code's bridge file — that file carries only `remaining_percentage`, a
window figure that **resets on compaction**, so a budget built on it would zero its own counter exactly when
a run got long.

**Ceilings, calibrated against measurement, not guessed.** Window: rolling 5 hours, account-wide across every
project, because that is the subscription constraint. Peak measured across 99 transcripts and 16,900 turns is
**1,961,285 output tokens** — a normal heavy day. Warn 2M, block 3M. Stall: output tokens since the last
durable artifact (commit, claim event, session file — read from disk, never from a self-report). Warn 200k,
block 400k, which is stop condition 3's envelope.

**Speed is a correctness property here.** `pre-tool-use.sh` documents <200ms because it fires on every call.
First implementation: **9,023ms cold and 8,315ms warm**, 2,005 transcripts, 2.8GB — the cache bought nothing
because dormant files were dropped from it and re-read in full every time. Now **299ms cold, 13–14ms warm**,
by using the one property that makes it sound: transcripts are append-only, so a file not modified inside the
horizon cannot hold a turn inside it. Stat, skip, never open. Pinned by a test that cold and warm agree.

**A self-referential bug, found by testing the stall path.** `lastArtifactAt` used the event log's mtime — and
the budget guard *appends to that log*. Every budget line, including a warning, looked like a freshly produced
artifact and reset the stall clock. **The guard would have zeroed the counter it exists to measure**, and the
stall ceiling could never have fired once logging began. It now reads claim events specifically.

**The safelist is load-bearing.** A blanket exit 2 would block `git commit`, so a session at the ceiling could
not save its work or write the session file the documentation gate requires — the budget creating exactly the
loss it exists to prevent. git, `npm run check`, session files and DECISIONS.md are always allowed.

**The override is the disposition pattern applied to spend.** `AGENTVIBE_BUDGET_OVERRIDE` needs a reason, and
it is appended to `events.jsonl` with the numbers at that moment. Overriding silently is impossible.

**Stated fail-open:** if the measurement throws, the call proceeds and stderr says the session is unguarded.
A budget that bricks a session when its own arithmetic breaks costs more than the overspend. Announced, not
discovered — the shape this repo has been burned by is the silent kind.

**The 5-hour window is an assumption, recorded as one.** `c-rolling-five-hour-window`, global scope, waived to
2026-09-08 alongside the other two live waivers and the shadow-window review. What is verified is consumption;
what is assumed is that 5 hours is the interval that matters. §3.8 required exactly this.

**Verified:** `npm run check` exit 0 · **215 tests** (10 new) · `ledger verify` 50 pass · 2 would_block
(canary) · 0 block. Remaining in Phase 6: war-room collapse, memory-file collapse.
