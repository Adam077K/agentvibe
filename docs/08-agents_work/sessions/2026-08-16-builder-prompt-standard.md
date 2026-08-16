---
date: 2026-08-16
role: builder
task: prompt-standard
tier: lite
qa_verdict: PASS
---

Writes `docs/03-system-design/agents/PROMPT-STANDARD.md` (+1 file, no code). The gate on every future edit under `.claude/agents/`, per the founder instruction at [2026-08-15-implementation.md:27-31](../handoffs/2026-08-15-implementation.md).

**`tier: lite`, not the `trivial` the brief asked for.** `node scripts/classify.mjs` computes `floor=lite` via `docs/03-system-design/**`. Hand-declaring `trivial` over the classifier is the un-mechanised tiering this repo's own rules table calls a wish.

**Every blocking rule was measured, not asserted.** 25 `FAIL` rule ids across 23 table rows, each run against all seven live engine files: **0 hits on 24 of 25**, and each fires on a constructed violation so none is vacuous. 8 rules are `WARN` and each names why a false positive is possible; 4 are `ADVISORY` and each says "no mechanism" out loud.

**The one exception is stated, not hidden.** `PS-MODEL-ENUM` specifies the target Claude 5 set and measures **7 of 7** — every engine is pinned to a superseded model, and a stale pin silently clamps `effort` ([GRANT-HOLDERS.md:176](../../03-system-design/agents/GRANT-HOLDERS.md)). It is explicitly **not blocking until the roster is re-pinned in the linter PR**, because a blocking rule that fails every good file is what §0 exists to prevent.

**The calibration constraint held and changed two rules.** Reusing `schema-lint.js:574`'s `VAGUE` over agent bodies fails **6 of 7** good files (10 sites) — so it is demoted to `WARN` and the finding is written into the standard as its method: *a rule inherits the grammar of the thing it was calibrated on.* `PS-BODY-TOOL-AFFIRM` at line scope fires on 2 legitimate negations in `reviewer-readonly.md:45-46`; at paragraph scope it reaches 0, because a line is not a sentence in a hard-wrapped file.

**One correction carried into the standard:** [AGENT-ARCHITECTURE.md:56](../../03-system-design/AGENT-ARCHITECTURE.md) still records `maxTurns:` as non-binding. §1.5 states the corrected version — it binds when the dispatch names an `agentType` — because a standard that forwards a stale row propagates it.

Baseline unchanged: `node .claude/hooks/schema-lint.js` on the seven → **7 pass · 0 fail · 1 warning** (`framer`, `isolation: none` with write tools, correct). `node scripts/check-registration.mjs` exit 0.
