---
role: builder
task: memory-eviction
date: 2026-08-25
branch: feat/memory-eviction
worktree: .worktrees/w4-eviction
tier: full
qa_verdict: PASS
verification: "npm run check → 30 of 30 passed · 0 failed · exit 0 (89.5s). npm run check:ledger → exit 0, 193 tests pass, ledger verify 79 pass · 9 would_block (shadow) · 0 block. node scripts/check-memory-budget.mjs → exit 0 over four capped files."
date_note: "Filename keeps the 2026-08-25 date the brief assigned. The eviction stamps read 2026-08-26 because that is when they were written; a stamp is a record of when, not of what the task was called."
---

# Session — typed, dependency-linked memory eviction

`DECISIONS.md` had **325 bytes of headroom** against a blocking 40,000-byte cap while CLAUDE.md rule 4 tells
every agent to append there. Rule 4 was unfollowable. The same condition occurred at 91 bytes, was relieved
by a manual eviction, and the mechanism was never built — so it recurred. Built it.

**Measured, before → after.** `DECISIONS.md` **39,675 → 30,271** (9,729 free, from 325). Volume 1
`DECISIONS_ARCHIVE.md` **34,472 → 34,472, byte-identical** — rotation appends forward, it never backfills.
New volume 2 **0 → 18,964**. Nine entry bodies moved; **zero headings lost**, all nine bodies verbatim in
volume 2, verified against `git show HEAD:` rather than against the tool's own report.

**The four rules are mechanised, not documented.** `scripts/lib/memory-entries.js` classifies; irreversible
with a live subject is never archived, all-`Affects:`-deleted is archivable on sight, anything a live claim
cites is pinned, and every archival leaves a stub under the original heading. No override flag. Rules 1 and
3 have **no live instance in this repo** — no entry is `irreversible`, no claim cites an individual entry —
so both are proven by construction in `scripts/evict-memory.test.mjs` in **both directions**: the rule
refuses, and the refusal lifts when the one property it turns on changes.

**The archive rotates rather than being pruned.** A single capped archive relocates the pressure; its
overflow message literally advised deleting records, inside the check that exists to preserve them. Volumes
are sequence-keyed, not period-keyed, because a period key needs a second rule the moment one period
overflows. Each volume is capped independently and found by pattern, so a new one is governed on creation.

**Three things the tool refuses to overstate.** A stub never says "no citations" — it names which scans ran.
Global-scope claims are outside the scan (machine state, absent on CI) and every stub declares it. And
`plan` prints **net** — entry minus stub — which is the number to act on: a 1,035-byte entry cited in 24
places nets 31 bytes, and was left in place for that reason.

**Out of scope, noted not fixed:** `DECISIONS.md`'s header says entries are "most-recent first" while the
file is appended most-recent-**last**.
