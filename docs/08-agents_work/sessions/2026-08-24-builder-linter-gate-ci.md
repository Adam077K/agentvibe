---
date: 2026-08-24
role: builder
session: builder-linter-gate-ci
task: close the mcp__ lint hole, demote five open-prose rules, bound the sweep verifiers, reconcile qa.js and ci.yml, state provenance blinding, wire two suites into CI
qa_verdict: REVIEWED-PASS-GATE-NOT-RUN
gate_run: false
gate_blocked_by: "npm run check does not pass on main — check:mc fails on mission-control/test/stream.test.ts:249 (EADDRINUSE), deterministic across two runs; no branch in this series touches mission-control"
review_rounds: 3
founder_signoff: "2026-08-24 — irreversible tier, signed off explicitly"
deviation_authorised_by: founder, 2026-08-24
tier: irreversible
branch: fix/linter-gate-ci
base: 695800e
---

`PS-TOOL-EXISTS` reads `mcp__<server>__<tool>` against configured servers: HEAD passed a fabricated
`mcp__nonexistent__doAnything` at exit 0, this branch exits 1 on the same fixture. Three rules over open
English (`PS-DISPOSITION`, `PS-PRIOR-BELIEF`, `PS-BODY-TOOL-AFFIRM`) are WARN, each defeated by a paraphrase
and each with a demonstrated false positive; review round 1 restored `PS-JUDGE-BLOCK-CONDITION` and
`PS-FALSE-CONSTRAINT` to FAIL as closed-set rules whose errors run false-negative, and floored
`scripts/prompt-standard.test.mjs` at irreversible because the demotion's only blocking guarantee lives
there — `schema-lint.js` exits on `failCount`, never `warnCount`. `qa.js`: `MAX_VERIFY` is a running total
across Phase 2 and every sweep round; round 1 found that cap fail-open, so dropped findings are returned as
`unverified_truncated` and force BLOCK exactly as a critical coverage gap does — and round 2 found that fix
applied to only one of the two copies of the verdict arithmetic, so `decideVerdict` in
`workflows/lib/gate-logic.mjs` now carries the same third condition, mutation-tested both ways (30 gate
tests, up from 23). The `maxTurns` account of the
reviewer dropout is superseded at the point of citation and the tool-call / turn / `maxTurns` unit mismatch
is stated, not reconciled; `ATTEMPTS` values untouched. Both reviewer engines and `orchestrator` carry the
provenance obligation, with the citation carve-out moved to a mechanism that is observable — the brief pastes
the cited excerpt. CI runs `test:pre-tool-use` and `test:probe-readonly`, and `ci.yml`'s branch-protection
claim is superseded: the 2026-08-23 push reported "2 of 2 required status checks are expected" and succeeded
having run neither. Verified individually, never chained.

**Gate deviation and irreversible sign-off, recorded rather than skipped.** The binding QA gate did NOT
run on this diff: its oracle runs `npm run check`, which does not pass on `main`. Three blinded review
rounds ran instead. Round 1 FAIL (2 P1: the demotion moved the blocking guarantee from an
irreversible/block file to a full/shadow one; the sweep cap dropped block-eligible findings invisibly
while criticalGap forced BLOCK for the same class of event). Round 2 FAIL (1 P1: the verdict arithmetic
exists in two hand-synced copies and only one was changed, so `test:gate` passed green while pinning
the pre-fix fail-open as correct). Round 3 PASS, verified by differential execution of qa.js's real
extracted logic against the spec (2000 calls, 0 mismatches) and 6-of-6 mutation kills.
`qa_verdict` is deliberately NOT `PASS` — no gate run produced one, and asserting it here would be the
author-written verdict P0 deleted. Founder signed off the irreversible tier explicitly on 2026-08-24.
