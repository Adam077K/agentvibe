---
date: 2026-08-23
agent: builder
task: qa-oracle-first-and-model-diversity-corrections
branch: fix/qa-oracle-first
qa_verdict: PASS
tier: irreversible
---

# Session Log: builder — oracle-first qa.js + MODEL-DIVERSITY.md corrections

**Date:** 2026-08-23
**Lead:** builder (lane2)
**Task:** P0.2 (oracle-first ordering in `.claude/workflows/qa.js`) + P0.5 (stale claims in
`MODEL-DIVERSITY.md`), then a round of fixes from an out-of-band review (1 P1, 2 P2).
**Status:** Complete, unreviewed since the second round (qa_verdict PENDING — irreversible tier,
`.claude/workflows/**`)

## What Was Done

- Added a `Phase 0: Oracle` to `qa.js`: one `agent()` dispatch (`reviewer` container, `haiku`) runs
  `npm run check` + diff-scoped typecheck/semgrep and returns structured `{pass, checks}`. On red
  or on dropout (4 attempts, fail-safe to BLOCK, same posture as the judge) the script returns
  BLOCK immediately, in the harness/oracle shape (not a review verdict), before `phase('Review')`
  ever runs — no dimension reviewer, verifier, or judge is dispatched.
- The runtime injects only `agent/parallel/phase/log/args/budget` (no shell) — the oracle's own
  single dispatch is therefore the floor for "run npm run check" at all, not a loophole in "zero
  agents dispatched." That property is about the review/verify/judge panel.
- Corrected `MODEL-DIVERSITY.md` §0 and §1.3: the "two of three verifiers assume the finding is
  false" claim was fixed in #42 and was stale; re-derived the `model: '` line table from the edited
  file rather than copying anyone else's numbers.
- **Review round 2 (P1 + 2×P2):** `oraclePrompt()` had no DATA-not-instructions injection guard,
  unlike its two sibling prompts, despite reading back command output from a diff the PR author
  wrote — added the same guard, and stopped calling the oracle "deterministic" unqualified (its
  checks are; the agent reporting them is not — stated plainly in a comment, with the failure mode
  named as degradation to panel-only, never a false PASS). Fixed a citation
  (`CONTROL-PLANE.md:201-202` doesn't state the no-shell constraint; replaced with
  `check-dispatch-agenttype.mjs:35-38`, which does). That fix shifted qa.js's lines a second time,
  so every §1.3/§0 citation in `MODEL-DIVERSITY.md` was re-derived again against the final file.
  Also closed a self-contradiction in §6 (Step 1 read as an outstanding TODO for something §1.3
  says shipped in #42; Step 4 had the identical problem for this branch's own oracle-first change)
  and re-derived two stale citations in §7 plus a grep pattern in §11 that would have undercounted
  after the oracle's `model: 'haiku'` dispatch was added.

## Files Changed

| File | Change |
|------|--------|
| `.claude/workflows/qa.js` | New Oracle phase (schema, prompt, `runOracle()`, short-circuit block, injection guard, honest framing), phases metadata, container-split comment |
| `docs/03-system-design/MODEL-DIVERSITY.md` | §0, §1.3, §6, §7, §11 brought into agreement with current `qa.js`; sourced research untouched |

## Verification

- Individual `npm run <step>` invocations, real exit codes (not piped through `tail` — caught and
  corrected my own earlier mistake of gating `&&` on `tail`'s exit status instead of the command's).
  4 failures across the full 27-step set, all pre-existing/environmental and unrelated to the two
  changed files: `lint:agents` + `test:skill-clamp` (both from this clone's sparse-checkout
  excluding `.mcp.json` — confirmed via an empty `git diff --stat origin/main..HEAD --
  .claude/agents/designer.md`), and `check:mc` (one pre-existing SSE-socket-bind failure in
  `mission-control/test/stream.test.ts`, nothing in `mission-control/` touched by this branch).
  Everything else passed, including `check:dispatch` (13 sites, 0 failures — the oracle dispatch
  resolves to `agentType: 'reviewer'`) and `check:dispatch-prompt`.
- `npm run test:tier-gate`: 17/17 pass.
- Short-circuit demonstrated by execution, both before and after the review-round fixes: a harness
  (`new Function` with mock `agent/parallel/phase/log/budget/args`, no `vm`) ran the actual edited
  `qa.js` body and counted real journal entries, not exit codes or summaries. Red oracle → 1 total
  dispatch (the oracle itself), 0 panel dispatches, `phases_entered: ["Oracle"]`, verdict BLOCK.
  Dropout → 4 dispatches (all oracle retries), 0 panel dispatches, BLOCK. Green → panel runs in
  full (7 dispatches: oracle + 5 reviewers + judge), verdict PASS — proving the gate is not
  permanently short-circuited. Re-ran after the P1/P2 fixes: identical counts.

## Blockers / Open Questions

- None. Diff-scoped typecheck/semgrep are best-effort inside the oracle prompt (semgrep is not
  installed in this repo; typecheck runs only if a changed file is covered by a tsconfig.json) —
  this was a judgement call within the brief's instruction, not an architectural decision beyond it.

---

_Session by: builder (lane2) | Date: 2026-08-23_

## QA verdict — recorded 2026-08-23

**PASS**, returned by an out-of-band `reviewer` engine (`review-lane2`) that did not produce this work and
holds no Write or Edit tools. Lenses applied: see that review's own report. History: **FAIL → PASS after 3 correction rounds**.

**This review was a single model family.** Irreversible tier nominally asks for 2-of-3 multi-judge, and the
`risk: high` predicate requires ≥2 distinct model families — there is no non-Anthropic model inside Claude
Code, so that bar is not reachable in this runtime today. **The founder accepted single-family review for
harness self-edits on 2026-08-23**, after the limitation was raised unprompted on every review round across
two sessions. It is recorded here as an accepted risk, not as a satisfied requirement.

**This PASS was recorded by the orchestrator from the reviewer's return, not by the author of the code.**
Under the gate as it stands on `main`, the verdict is an author-writable line in a file — which is exactly
the defect `feat/gate-pr-route` replaces with a verdict bound to the diff hash and posted as a check-run.
Until that lands, this line is a convention, and the separation above is the only thing behind it.

The reviewer's final PASS was returned against this branch's head **before** this verdict line was added; appending the verdict necessarily changes the diff it was given. That is unavoidable while the verdict lives inside the reviewed tree, and is the specific problem the diff-bound verdict record solves.
