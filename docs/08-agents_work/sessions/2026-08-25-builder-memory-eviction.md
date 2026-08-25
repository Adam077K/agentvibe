---
role: builder
task: memory-eviction
date: 2026-08-25
branch: feat/memory-eviction
worktree: .worktrees/w4-eviction
tier: irreversible
tier_note: "The brief assigned `full` on the basis of `.claude/memory/**`. The classifier disagrees and the classifier is the one implementation: `node scripts/classify.mjs` over this diff returns `floor=irreversible`, because `scripts/lib/memory-entries.js` matches `scripts/lib/**` (tier=irreversible, enforcement=block). Recorded as the classifier computes it, not as the brief assumed — a session file asserting a tier the classifier contradicts is the two-implementations defect wearing a different hat. This raises the review bar: irreversible needs 2-of-3 multi-judge and founder sign-off."
qa_verdict: PASS
verification_round2: "After the 2026-08-26 adversarial review: npm run check 30 of 30 · 0 failed · exit 0; check:ledger exit 0, 0 block; 64 memory tests pass. Mutation survival re-measured — post-write verification 2 fail, destination content 2 fail, conservation gate 1 fail, existsSync guard 1 fail, archive cap 1 fail, fence tracking 5 fail, reversibility fail-closed 5 fail. None is 0."
verification: "npm run check → 30 of 30 passed · 0 failed · exit 0 (83.3s). npm run check:ledger → exit 0, 193 tests pass, ledger verify 79 pass · 9 would_block (shadow) · 0 block. node scripts/check-memory-budget.mjs → exit 0 over four capped files. node scripts/classify.mjs over the diff → floor=irreversible."
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

**The headroom was then spent on purpose, which is the point.** After merging the moved base
(`8bf9950` → `67947fc`; neither commit touches `.claude/memory/`, and the budget was **re-measured**, not
assumed, at an unchanged 30,393) the fifth founder decision of 2026-08-25 — the branch-protection deferral,
until now stranded in `docs/STATUS.md` because it could not be recorded without breaching a blocking cap —
was written in at **3,020 bytes, the largest entry in the file, uncompressed**. That is the test the brief
set, and it passed: nothing was trimmed to fit.

**Final headroom is 6,587 bytes, below the 8–10 KB the brief targeted, and I stopped there deliberately.**
Reaching 8 KB from here requires evicting entries that are recent and live (2026-08-24, 2026-08-25) or
`hard-to-reverse` and guarded — using the number to justify overriding the caution this design exists to
enforce. Every remaining candidate with a good `net` is one of those; the rest net under 500 bytes. 6,587 is
~3 entries of room **and** there is now a six-second tool that makes more, which is the durable fix. If the
band is wanted regardless, `2026-08-11::Claim ledger replaces the diff gate` is the cleanest single case
(net 1,091; its own body carries `**See:** ADR-001`, so it names its successor) — one command, on request.

**Reviewed adversarially 2026-08-26: FAIL, 2 P1s and 5 P2s, all fixed.** The eviction that had
already run was re-verified clean by the reviewer's own parser — 0 lines short, 9 bodies verbatim,
0 headings lost — and **every defect lived in a path that run did not take**, which is how they
survived: nothing exercised them, so nothing contradicted them. The two that mattered: a dated
heading inside a **code fence** tore an entry in half and let the fabricated tail be archived out
from under its refused parent (and `DECISIONS.md`'s own `## Format` section demonstrates that exact
construct); and a "fresh" volume was never checked against the disk, so `writeFileSync` could
O_TRUNC irreplaceable history while printing *"conservation closes to zero"*. Also closed:
conservation covered only the source and is now re-verified **from disk** after the write;
`Reversibility:` failed **open**, so a one-character typo was the override flag this tool claims not
to have; and `plan`'s `net` was 62% optimistic **in the direction of evicting**.

**The lesson worth keeping is about the tests, not the code.** Deleting the entire conservation gate
cost **zero** failing tests before this round. Two distinct things were fixed and an earlier version of
this paragraph merged them, which a delta review caught: the **post-write verification** now *throws*, so
its call site has no `if` to delete; the **conservation gate** still returns a list and is still consumed
by an `if`, but it was extracted into a pure `conservationIssues()` and each of its five conditions is now
reachable from a test on its own — four of them previously mutated to **zero** failures because the
defects they catch were caught elsewhere, by direct file assertions, which made the gate thinner than the
mutation table implied.

**A delta review then returned FAIL again, and one of the two P1s was a regression from the fix above.**
Widening `fieldValue`'s selector so a bolded or list-item `Reversibility:` could be read also made a
*fenced* one able to shadow a real one — so rule 1 was bypassed by a readable **wrong** value where it had
just been closed against an unreadable one. `parseDecisionEntries` was fence-aware and `fieldValue` was
not; there is one shared tracker now. The second P1: a four-backtick fence wrapping a three-backtick
example was closed by the inner run, which is the *standard* way to show a code fence in markdown. Closer
rules are CommonMark's now — same character, at least as long, no info string.

**Out of scope, noted not fixed:** `DECISIONS.md`'s header says entries are "most-recent first" while the
file is appended most-recent-**last**.
