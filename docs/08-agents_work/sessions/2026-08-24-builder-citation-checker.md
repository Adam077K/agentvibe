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

**Round 2 after an independent FAIL (11 findings).** Fixed: EOF off-by-one from `split('\n')`
(every real file read one line long, and the fixture had no trailing newline so it could not
reproduce it); anchors now read BOTH sides; clause breaks hidden by `**bold.**`; directory names
and list continuations excluded as anchors; word-bounded token matching. Every finding now names
the file it opened and flags basename inference, ambiguous locators are listed rather than merely
counted, and the unqualified pass message is gone — coverage prints on every path, because only
15% of locators resolve exactly and only 26% get a drift check at all. 47 tests; 28 of 30 `check`
steps exit 0 (`test:skill-clamp` EPERM in-sandbox, `check:mc` needs `bun install` — both pre-existing).
