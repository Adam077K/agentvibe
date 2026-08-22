---
date: 2026-08-22
role: builder
task: memory-eviction
qa_verdict: FAIL
tier: full
risk: full
branch: chore/memory-eviction
---

# DECISIONS.md eviction, the archive cap — and the review that failed it

**Verdict is FAIL, and it is not a formality.** An independent reviewer judged this branch on the `evidence`
lens and returned FAIL with two p1 blockers. The commits described below are the remediation; **no reviewer
has yet judged the remediation.** This file therefore blocks `qa-lead-pass.yml` by design — the gate requires
`qa_verdict: PASS` on every session file in the diff, and it should not get one from the author of the work.
88 of 91 session files in this repo say PASS and zero say FAIL; that is the number this file exists to change.

**What the branch does.** Evicts 7 completed entries from `.claude/memory/DECISIONS.md` to
`DECISIONS_ARCHIVE.md` (39,909 → 35,952 bytes at branch head, back under the 40,000-byte cap), adds a
40,000-byte cap on the archive itself in `scripts/check-memory-budget.mjs` with tests, and corrects two
false sentences in CLAUDE.md.
Conservation was verified byte-for-byte: six of the seven bodies are identical in the archive; the
seventh, 2026-08-12 *Phase 8 chosen over Phase 9*, carries a correction note added on purpose (its
1,283 ms figure was refuted by the 2026-08-13 entry). Nothing was deleted — zero lines removed.

**F1 — this PR had no session file of its own.** The only one in the diff,
`2026-08-20-ceo-audit-and-challenge.md`, declares `branch: docs/ceo-audit-round`. A `full`-tier change adding
a new CI-blocking cap would have merged on a PASS authored for unrelated work — the exact defect class named
in `qa-lead-pass.yml:80-89`. Closed by this file. The audit session file is left as it is: it is an accurate
record of different work, and rewriting its `branch:` would hide the collision rather than fix it.

**F2 — three eviction stubs asserted "no citations"; citations existed.** The rule was *pin anything still
cited*; what was applied was a **title-phrase grep**, which cannot see a citation made by date or by
paraphrase. Four stubs were wrong, not three — the fourth was found while fixing F3:

| Evicted entry | Real citation, verified by grep |
|---|---|
| 2026-08-12 *Two enforcement mechanisms found green* | `2026-08-13-rethink-board.md:19` (quotes the body verbatim) · `mission-control/test/collectors.test.ts:445` · `mission-control/test/views.test.tsx:1961` — two tests reason from it |
| 2026-08-16 *Ship five engines, defer the two that hold credentials* | `handoffs/2026-08-15-implementation.md:112-114`, where it is an item **still open on the founder** |
| 2026-08-12 *Phase 8 chosen over Phase 9* | `mission-control/server/projects.ts:3` — cited **by date**, and the fleet-scope default that file relies on is this entry's `Open, needed before PR3:` line |
| 2026-08-11 *Capabilities: enforce what the runtime enforces* | `TARGET-ARCHITECTURE.md` lists it under **Keep** for the Mem0 deletion sweep |

Why this was blocking rather than cosmetic: the new cap's own guidance
(`scripts/check-memory-budget.mjs:69-72`) tells the next person to delete archived records *"once nothing
references them any longer."* A false "no citations" in permanent memory is a scheduled deletion of
still-referenced entries. Each stub now states **what was actually checked** and names the citations found;
the two stubs where a grep genuinely found nothing say so in those words. One line added to the archive
header records that the criterion was a title-phrase grep, so it is not overstated anywhere.

**F3 — two live citations rotted because this PR moved the lines.** `TARGET-ARCHITECTURE.md` cited
`DECISIONS.md:322-347` for a **binding constraint on security wording**; after eviction that range lands on
an unrelated stub. It and `DECISIONS.md:118-124` now cite **by date and title**, which no future eviction
moves. Both re-verified to resolve to the intended entries.

**F4 — the arithmetic did not reproduce.** CLAUDE.md said *"39,909 bytes at 23 entries; at ~1,400
bytes/entry the cap fires near 28."* 39,909 ÷ 23 = **1,735**, and ~1,400 was the *post*-eviction all-entry
mean, depressed by archive stubs the checker counts as full entries — right answer via two offsetting
errors. Now stated from its anchor: marginal cost 1,735 (pre) / 1,822 (17 real entries), 4,925 bytes of
headroom, cap fires on the **27th** entry. Not 28 — the F2 stub rewrites consumed headroom, which is itself
the reason the paragraph now names the command that recomputes instead of inviting the next quote.

**Verified by execution:** `check:memory` · `check:registration` · `check:ledger` · `lint:agents` all exit 0.
`npm run check` in full was **not** run to completion — `check:mc` needs a socket bind unavailable here, so
that suite is unverified by me. Nothing was pushed, no PR opened, nothing merged.
