---
date: 2026-08-22
role: builder
task: memory-eviction
qa_verdict: PASS
tier: full
risk: full
branch: chore/memory-eviction
---

# DECISIONS.md eviction, the archive cap — and the four rounds it took

**Verdict is PASS, and it took four rounds to earn. It was FAIL twice.** Both are kept below, because a bare
PASS at the end of that sequence would hide what the gate actually did.

| round | verdict | what it found |
|---|---|---|
| 1 | **FAIL** | two p1 on `evidence` — this PR's only session file was written for a *different branch*, so the gate would have passed it on a borrowed verdict; and three eviction stubs asserted "no citations" where citations existed |
| 2 | **PASS** | both p1 closed. New medium: the eviction had separated a superseded figure from its correction, leaving a refuted 1,283 ms measurement in the archive with no marker |
| 3 | **FAIL** | that fix was sound but left two of this PR's *own records* stating things that no longer reproduced, plus a mischaracterised citation |
| 4 | **PASS** | no findings. Seven stated figures reproduce exactly; conservation 6/7 with **zero** original lines lost; both mischaracterisations gone |

**This verdict is the reviewer's.** It is transcribed here by the orchestrator because someone must record
it and neither the engine that produced the work nor the engine that judged it may. Every round was an
independent `reviewer` that did not produce the work — and **every one was a single model family**.
`risk: irreversible` nominally wants two distinct families; this runtime has none. That is a structural
limit on record, not a satisfied bar.

**Why round 4 was the last.** The findings converged — p1 → medium → low → nothing, a descending series
rather than a treadmill — and round 4 was the first to **return** headroom rather than spend it:
`DECISIONS.md` went 36,573 → **35,952 bytes**, the Phase-8 stub 1,639 → 1,018 B. The prose got shorter *and*
truer. A fifth hand-written round is precisely what the ceiling measurement below says is exhausted.

88 of 91 session files in this repo said PASS and zero said FAIL. This one said FAIL for three rounds, and
that is the number it existed to change.

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
