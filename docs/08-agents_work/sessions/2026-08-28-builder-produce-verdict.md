---
role: builder
task: produce-verdict — the step that makes a QA verdict exist
date: 2026-08-28
branch: feat/produce-verdict
base: b4ea862
tier: full
tier_driver: scripts/** (scripts/produce-verdict.mjs)
qa_verdict: PASS
---

- `scripts/produce-verdict.mjs` closes `router emits invocation → ??? → gate checks a binding`. It runs the panel in a bare session whose cwd is a materialised copy of `origin/main`, then decides **only** from `verdict.mjs check` — never from the session's prose (the `tool_result` is a launch receipt). Four states: PRODUCED 0 · BLOCKED 1 · REFUSED 2 · NOT_REQUIRED 3, `established = outcome !== REFUSED`.
- **A1 (HIGH, fixed).** The provenance control covered `.claude/workflows/**` while the router and the checker were invoked from the running copy's own directory — the PR. A review demonstrated a PR shipping a hostile `scripts/verdict.mjs` reaching EXIT 0 · PRODUCED with **no record anywhere and no panel launched**. The judging project is now the **whole tree at the ref**, the artifact is read with `judge.verdictBin`, and the pre-check happens after materialisation so a forgery cannot suppress the run.
- **A1, the half that cannot be closed from here:** `run-gate.mjs` derives `REPO_ROOT` from its own location, so main's copy cannot classify a PR tree. The router is PR-provenance by construction. `crossCheckArgs()` re-derives `tree` and the ref tip with this process's own `git` and refuses on disagreement.
- **A2 (HIGH, fixed).** `qa.js` dispatches `reviewer` and `reviewer-readonly`; neither resolved in a workflows-only directory nor at user scope, so the panel would have errored or fallen back to `general-purpose` with tools `*` — handing `Write`/`Edit` to the binding judge. Whole-tree materialisation + a completeness check + `REQUIRED_AGENTS`, pinned against `qa.js`'s own constants by a drift test.
- **A3 (MEDIUM, fixed):** `canonical()` now resolves the nearest existing ancestor, so the containment refusal no longer fails open on a not-yet-existing symlinked `dest`. Its stated reason is corrected too — untracked files do not move the subject.
- **A5 · E3 · E4 (LOW, fixed):** shell-unsafe trees refused and the goal quotes anyway; the flag screen tests a leading `-` so `-json` is refused rather than dropped; the ref tip must be a full 40-hex sha.
- Evidence: `npm run check` **48 of 48 · 0 failed · exit 0**, 222.5s, sandbox armed · `test:merge-gate` 93 pass · 0 fail · 10-cell mutation table with the operator itself controlled, 9 FIRED and 1 SILENT, all as predicted — including M8 (read with the PR's checker) and M10 (`canonical` fallback), both of which the reviewer measured SILENT before this round.
- **Not done, and it is the same gap as last round:** the end-to-end panel has never been driven through this mechanism. Whether the runtime accepts a materialised tree as a project is **unresolved** and is what that run would settle.
- **Standing caveat:** author-recorded, one agent, one model family. *The checks ran and are green* is not *the tier was satisfied*.
