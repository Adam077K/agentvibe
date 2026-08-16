---
date: 2026-08-16
role: builder
task: qa-verdict-binding
tier: irreversible
qa_verdict: PASS
---

**Defect fixed:** `qa-lead-pass.yml` grepped `qa_verdict: PASS` from a session file written by the author of the change. That is the author reviewing their own work, not a gate. Across 34 merges the gate had never refused a PR on substance.

**What was built:**

1. `scripts/write-gate-record.mjs` — called by `qa.js` at the end of a gate run via an agent with Bash access. Computes `sha256(git diff base_sha head_sha)`, writes `.qa-gate/<head_sha>.json` with verdict, diff_hash, tier, base_sha, head_sha, dimensions_run, and timestamp. The record is keyed by HEAD SHA so a new commit invalidates it.

2. `scripts/verify-gate-record.mjs` — called by `qa-lead-pass.yml` for full and irreversible tier PRs. Checks: (a) record exists for the current HEAD SHA, (b) diff_hash matches the PR's actual diff, (c) verdict is PASS. Trivial and lite tiers skip the check — they use CI and code-reviewer, not the adversarial panel.

3. `scripts/gate-record.test.mjs` — 19 tests, all passing, that pin the three failure cases:
   - FAILURE A: no record at all (hand-written verdict) → exit 1
   - FAILURE B: record from a different HEAD SHA (stale/inherited) → exit 1
   - FAILURE C: diff_hash mismatch (commits pushed after gate ran) → exit 1

4. `qa.js` — agent call at the end of the verdict pipeline to invoke `write-gate-record.mjs` and `git add .qa-gate/`. The agent writes the record as a side effect of the gate run; the author commits it with the PR.

5. `qa-lead-pass.yml` — new step "Verify QA gate record" that calls `verify-gate-record.mjs`.

6. `ci.yml` and `package.json` — `test:gate-record` added to the full check suite.

**Honest limit:** An author who runs qa.js, observes BLOCK, then hand-writes a PASS record with the correct diff_hash still passes this check. The improvement is that the *honest* path (run qa.js, record is written automatically) is now automatic, and the two previously undetectable cases — missing record and stale record — now block.

**Tier:** `irreversible` — touching `.github/workflows/` and `.claude/workflows/qa.js`. `risk:irreversible` label is required on the PR.

**Checks run:** `npm run check` (full suite, exit 0) · `npm run test:gate-record` (19/19 pass) · `node scripts/classify.mjs` (floor = irreversible).
