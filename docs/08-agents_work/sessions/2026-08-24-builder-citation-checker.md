---
role: builder
task: citation-range-checker
date: 2026-08-24
branch: feat/citation-range-checker
tier: full
qa_verdict: PENDING
---

**Built `scripts/check-citations.mjs`** — WARN posture, `--strict` exits 1, not wired to CI. It
harvests `path:N` / `path:N-M` locators from markdown via `proseCodeSpans`, now **exported** from
`ledger.mjs` behind an entry guard rather than copied, and resolves them against `git ls-files`.

**The existence class found ZERO of 813 locators broken, and that is the finding.** All six
known-stale locators in the audit point at lines that exist; an existence check cannot see them. So
a clause-anchored *drift* class was added and measured: it reports **47 findings**, catching 2 of
the 6 (`schema-lint.js:597`, `qa.js:100`). Four are missed — a clause separates anchor from
locator, or no anchor exists. Precision, false-positive mode, and all four misses are stated in the
file header. Verified: `check:citations` 32/32; 28 of 29 `check` steps exit 0 (`test:skill-clamp`
fails EPERM in-sandbox, pre-existing). Regenerated `CODEBASE-MAP.md`, which my own scripts staled.
