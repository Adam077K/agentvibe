---
date: 2026-08-24
role: builder
session: builder-linter-gate-ci
task: close the mcp__ lint hole, demote five open-prose rules, bound the sweep verifiers, reconcile qa.js and ci.yml, state provenance blinding, wire two suites into CI
qa_verdict: PENDING
tier: irreversible
branch: fix/linter-gate-ci
base: 695800e
---

`PS-TOOL-EXISTS` reads `mcp__<server>__<tool>` against configured servers: HEAD passed a fabricated
`mcp__nonexistent__doAnything` at exit 0, this branch exits 1 on the same fixture. Five rules over open English
(`PS-JUDGE-BLOCK-CONDITION`, `PS-DISPOSITION`, `PS-PRIOR-BELIEF`, `PS-FALSE-CONSTRAINT`, `PS-BODY-TOOL-AFFIRM`)
are WARN — each is defeated by a paraphrase, now pinned. `qa.js`: `MAX_VERIFY` is a running total across Phase 2
and every sweep round with truncation logged by finding id; the `maxTurns` account of the reviewer dropout is
superseded at the point of citation, and the tool-call / turn / `maxTurns` unit mismatch is stated, not
reconciled. `ATTEMPTS` values untouched. Both reviewer engines and `orchestrator` carry the
`independence: provenance` obligation. CI runs `test:pre-tool-use` and `test:probe-readonly`, and `ci.yml`'s claim that branch protection made both
jobs block is superseded at the point of citation — the 2026-08-23 push that moved `main` reported "2 of 2
required status checks are expected" and succeeded having run neither; `qa-lead-pass.yml` was right and is
unmodified. Verified
individually, never chained: the 9 named commands exit 0, plus 14 more. `lint:agents` is 18 pass · 0 fail ·
0 warnings before and after — the five measured zero as FAIL rules, so demoting adds no warning to a corpus
they never fired on.
