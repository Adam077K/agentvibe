---
role: builder
task: citation-range-checker
date: 2026-08-24
branch: feat/citation-range-checker
tier: full
qa_verdict: PENDING
---

**`scripts/check-citations.mjs`** — WARN posture, `--strict` exits 1, not wired to CI. Harvests
`path:N` locators from markdown via `proseCodeSpans`, exported from `ledger.mjs` behind an entry
guard rather than copied. Two classes: EXISTENCE (deterministic; finds 2 dead paths and zero bad
line numbers across 815 locators — that result is the finding, not reassurance) and DRIFT
(clause-anchored heuristic; 76 findings over 209 anchored citations).

**Rounds 2-3 after an independent FAIL — all 11 findings settled.** Fixed: EOF off-by-one from
`split('\n')` (every real file read one line long; the fixture had no trailing newline so it could
not reproduce it); anchors read BOTH sides; clause breaks hidden by `**bold.**`; directory names,
list continuations and arrows excluded as anchors; word-bounded matching. Findings name the file
they opened and flag basename inference; ambiguous and cross-repo locators are listed, not merely
counted; dead paths carry a did-you-mean; the unqualified pass is gone — coverage prints on every
path, since only 15% of locators resolve exactly and 25% get a drift check. The source-text test
was replaced by a differential one against `ledger.mjs` per `writing-good-tests`.

**Round 4 (post-PASS residuals).** `--external-prefix` now REFUSES a prefix naming a real directory
of this repo — it turned a misspelled `scripts/` path into a silent tick, the exact failure its
empty default exists to prevent. Two residual false-positive shapes documented rather than coded
around (comment-block tops, renamed parameters). Corpus counts removed from the header entirely:
the printed coverage block is authoritative, prose states shapes. `--json` gained a full resolution
inventory — and building it exposed that `process.exit()` never flushed async stdout, so
`--json | jq` had been truncating at 64KB.

**FOUND AND DELIBERATELY NOT FIXED HERE:** `scripts/check-dispatch-agenttype.mjs` and
`scripts/check-dispatch-prompt-size.mjs` share that same `console.log(JSON.stringify(...))` then
`process.exit()` shape and will truncate piped `--json` once their payloads pass 64KB. Both are
under it today. Left alone because they are separate files and one is wired into a blocking check;
routed as its own PR. This was not missed. 56 tests, five mutation-checked. Rebased onto `c0e52dc`.
