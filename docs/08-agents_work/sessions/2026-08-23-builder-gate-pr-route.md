---
date: 2026-08-23
role: builder
task: gate-pr-route
qa_verdict: PENDING
tier: irreversible
branch: feat/gate-pr-route
session: ceo-4-1787176363
decisions:
  - "The signed artifact is a GitHub check-run created with the workflow's own GITHUB_TOKEN, not the verdict record itself — the record stays hash-bound (anyone with repo-write can author a .qa/verdicts/*.json file); the check-run is what a PR author cannot forge"
  - "The bypass step ('Check for QA gate bypass') no longer makes the pass/fail decision on its own. It only computes bypass_approved and hands it to the Verdict step via steps.bypass.outputs, so bypass still works even though the gate's PASS path moved"
  - "Kept the tier-floor classifier, claim ledger, and tier-session-enforcement steps unconditional (they no longer sit behind an early exit 1) so they always run and can independently fail the job — this is a side effect of removing the early hard-fail, not a new gate"
claims_touched:
  - c-qa-gate-blocks
---

# Lane 1 — P0.1 and P0.4: PR-route verdict gate promoted to blocking, signed by GITHUB_TOKEN

## P0.1 — `.github/workflows/qa-lead-pass.yml`

Closed the defect where the gate read `qa_verdict: PASS` out of session-file **prose in the PR diff** —
text a PR author writes themselves, and which an integration branch merging two finished branches could
inherit (each written for different work; measured true of all three integration branches built last
session).

Three changes, all present:

1. **Promoted the shadow "verdict diff-binding check" step to blocking.** The `|| true` that swallowed
   `node scripts/verdict.mjs check --json`'s exit code is gone; the step now reads the JSON, decides
   `success`/`failure`, and `exit 1`s the job when the diff-bound verdict is absent or non-matching and no
   bypass is granted.
2. **The verdict is posted as a GitHub check-run** (`gh api repos/$REPO/check-runs`) authenticated with the
   workflow's own `GITHUB_TOKEN` (new `checks: write` permission). The security property: a PR author can
   write any line into a file they author, but cannot mint a check-run without that token.
3. **Deleted both author-grep sites** (`grep -qiE 'qa_verdict:...'`, the multi-session loop and the
   single-file fallback). The step that used to own that logic ("Check QA Lead PASS or bypass") is now
   "Check for QA gate bypass" — it only resolves the `qa-lead-bypass` label + Adam's `BYPASS REASON:`
   comment into a `bypass_approved` output; the actual PASS/FAIL decision lives entirely in the (now
   blocking) verdict step, which reads that output for the override path. Stale echo blocks describing the
   old file-content mechanism were rewritten to describe the new one, in both the job-level header comment
   and the step-level comment above the verdict step.

Verified `grep -c continue-on-error .github/workflows/qa-lead-pass.yml` → `0` and
`grep -c 'grep -qiE' .github/workflows/qa-lead-pass.yml` → `0` before committing, and parsed the file with
`python3 -c "import yaml; yaml.safe_load(open(...))"` → OK.

## P0.4 — `package.json`

Added `npm run test:tier-gate` into the `check` chain (between `test:run-gate` and `test:merge-gate`,
grouped with the other gate tests). It previously ran in `ci.yml` only.

## Verification

- `npm run test:tier-gate` — 17/17 pass.
- Full `npm run check` and `npm run test:tier-gate` run union-verified; see the return payload for the
  exact tail of any failure (`check:mc`'s SSE test is expected to fail in-session — cannot bind a listening
  socket in this sandbox).
- Did not attempt to reproduce any CI shell step in zsh; all script invocations here were run through
  `npm run`, which invokes the scripts with real argv, not through a hand-typed zsh word-split.

## Scope discipline

Touched only `.github/workflows/qa-lead-pass.yml`, `package.json`, and this session file. Did not touch
`.claude/agents/designer.md` or `.mcp.json` — confirmed via `git diff --stat origin/main..HEAD` before
commit.
