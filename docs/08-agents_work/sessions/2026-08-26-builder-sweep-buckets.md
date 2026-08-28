---
date: 2026-08-26
role: builder
task: sweeps-report-what-they-could-not-classify
qa_verdict: PASS
tier: full
risk: full
branch: fix/sweeps-report-what-they-could-not-classify
commits: 3
---
# Two sweeps now report what they could not classify, and cross-count against a counter they did not write
**Layer 1 — the third bucket, both sweeps.** `check-dispatch-agenttype.mjs`: **26 occurrences across both universes → 17 sites + 9 unclassified**, each listed with `file:line` and a reason (`masked` ×6, `md-prose-mention` ×3). `check-citations.mjs`: **876 locators → 856 resolved + 20 unchecked** (`ambiguous` ×19, `external` ×1). Every excluded item is *named*, so an empty bucket means "nothing was ambiguous", never "nothing was looked at". Printed on the **passing** path too — a bucket you only meet on failure is a bucket nobody reads.
**Layer 2 — the cross-count, and the .js half alone was not the universe.** The first cut counted `agent(` in `.js` only, leaving **4 of 17 real sites with no universe at all** — a coverage line reporting coverage it did not have, which is the same defect one level up. Both halves are counted now (`19` js + `7` md) and the identity spans them; `check-citations.mjs` additionally cross-checks the `unchecked` **array** against the `stats` **integer counters**, two accumulators of one quantity by different mechanisms.
**My own identity assertion was miscalibrated and nearly reddened a BLOCKING step.** It asserted six resolution counters partition the locators; an `--external-prefix` citation is harvested (counts as a locator) then excused from checking by design (increments none of the six). **Seven dispositions, not six.** Caught before commit, corrected, and pinned by a test that constructs an external citation.
**Three measurements said the identity held, and all three were the shell.** `node … $A --json` with `A="--no-anchors --strict --external-prefix adamos"` — zsh does **not** word-split an unquoted expansion (`c-zsh-no-word-split-on-expansion`), so the script got **one 43-char argument**, matched no flag, and silently ran a *different posture* where six does partition. Literal flags: `six 875 + external 1 = 876`.
**REPORTED, NOT FIXED, per the brief.** `check-citations.mjs`'s `RESOLUTION:` line prints the six counters as a partition, so it accounts for **875 of 876** while the headline above it counts that same item among the 20 "could not check" — two lines of one block disagreeing by one. Both postures are unchanged: `check:citations-exist` still **blocks**, the drift half still **WARNs**. The 9 + 20 unclassified items are reported, none fixed.
**Verified by mutation, not by assurance.** 4 mutants of the citations identity (missing disposition · external term dropped · double-count · counter dropped) → all exit 1, control exit 0. 2 mutants of the cross-count → both exit 1, attributed distinctly. 4 mutants of the dispatch checker → the new tests go red (26/4, 26/4, 27/3, 28/2), restored **30/30**. 3 data mutants of the citations checker → red (59/3, 60/2, 57/5), restored **62/62**.
**Suite:** `npm run check` → **48 of 48 passed · 0 failed · 138.5s · exit 0**, sandbox armed. `STEPS.length` = **48**, unchanged — `scripts/lib/check-suite.js` is reverted and untouched, because putting a doc comment in `scripts/lib/**` raised the floor to **irreversible** for a reporting-only change; the canonical rule lives in `docs/03-system-design/SWEEP-REPORTING.md` (lite) instead, pointed at from both sweeps. Floor: **full** (`scripts/**`).
