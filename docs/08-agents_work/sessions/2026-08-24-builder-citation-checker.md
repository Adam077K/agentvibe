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
was replaced by a differential one against `ledger.mjs` per `writing-good-tests`. 53 tests, three
mutation-checked; 28 of 30 `check` steps exit 0 (`test:skill-clamp` EPERM in-sandbox, `check:mc`
needs `bun install` — both pre-existing and untouched).
