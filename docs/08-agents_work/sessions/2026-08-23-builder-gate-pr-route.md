---
date: 2026-08-23
role: builder
task: gate-pr-route
qa_verdict: PENDING
tier: irreversible
branch: feat/gate-pr-route
session: ceo-4-1787176363
decisions:
  - "CORRECTED 2026-08-23 after review found the original version false: the check-run is signed with the workflow's own GITHUB_TOKEN, but that does NOT make it unforgeable here — pull_request (not pull_request_target) runs from the PR's own head and withholds elevated permissions only for fork-origin PRs, and this repo has no forks in its normal flow, so a same-repo PR (this one included) holds checks: write and could rewrite the verdict step to hardcode success. What it actually buys: forgery now costs modifying a workflow file in the same PR (irreversible-tier, conspicuous) instead of writing a line into a session file. Closing the residual gap needs branch protection or CODEOWNERS on .github/workflows/** — a repository setting, the founder's call, not a code change. Basis: GitHub's documented pull_request semantics, not a live reproduction (no network in this sandbox)"
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
   workflow's own `GITHUB_TOKEN` (new `checks: write` permission). **Correction after review (see below):**
   this does NOT make the check-run unforgeable. `pull_request` (not `pull_request_target`) runs from the
   PR's own head and withholds elevated permissions only for fork-origin PRs; this repo has no forks in its
   normal flow, so a same-repo PR — including this one — holds `checks: write` too and could rewrite the
   verdict step's bash to hardcode success. What it actually buys: forgery now costs modifying a workflow
   file in the same PR (an `irreversible`-tier, conspicuous change) instead of writing a line into a session
   file. Closing the gap needs branch protection or CODEOWNERS on `.github/workflows/**` — a repository
   setting, the founder's call. Basis: GitHub's documented `pull_request` semantics, not reproduced live
   (no network in this sandbox).
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
- `npm run check` is an `&&` chain and aborts at the first failure; ran every constituent step individually
  instead. Result: 4 FAILs, all pre-flagged/environmental — `lint:agents`, `check:prompt-standard`, and
  `test:skill-clamp` share one root cause (the sparse clone deliberately excludes `.mcp.json`, so any check
  reading "is an MCP server configured" fails on designer.md's `mcpServers: [playwright]`); `check:mc` fails
  its `stream.test.ts` SSE case (`EADDRINUSE` binding a listening socket in-session — 344/345 other
  mission-control tests pass). Every other step, including `check:ledger` — the one that would catch a
  falsified `c-qa-gate-blocks` claim — passes clean.
- Did not attempt to reproduce any CI shell step in zsh; all script invocations here were run through
  `npm run`, which invokes the scripts with real argv, not through a hand-typed zsh word-split.

## Review correction (2026-08-23)

Out-of-band review returned FAIL on one P1: the original comments (permissions block, step-level "Binding
model", and decision #1 above) claimed a PR author "cannot mint a check-run without this token." That is
false for this repo's threat model — verified against GitHub's documented `pull_request` semantics (not a
live reproduction; this sandbox has no network to check against GitHub Actions). `qa-lead-pass.yml` triggers
on `pull_request`, not `pull_request_target`, and GitHub withholds elevated permissions only for fork-origin
PRs; this repo has no forks in its normal flow (the worktree protocol pushes straight to `origin`), so a
same-repo PR gets the full declared `permissions:` block including `checks: write`, and a PR that rewrites
the verdict step's bash to hardcode success still holds that token.

Fixed in three places, all in `.github/workflows/qa-lead-pass.yml` and this file: the permissions-block
comment, the step-level "Binding model" comment on the verdict step, and decision #1 above. The corrected
claim: the check-run raises the cost of forgery from "write a line in a session file you author" to "modify
a workflow file in the same PR" (`irreversible`-tier, conspicuous), not to unforgeable. Named the control
that would actually close the residual gap — branch protection or CODEOWNERS requiring separate human
approval on `.github/workflows/**` — and stated plainly that it is a repository setting and the founder's
call, not something this PR can do, consistent with the file's existing header comment about branch
protection. Did not switch to `pull_request_target` (would run untrusted PR code with the base branch's
elevated trust — worse) and did not revert the check-run mechanism (it is still a real improvement over the
grep it replaced).

P3 (non-blocking, addressed): the verdict step uses `set -uo pipefail` instead of `set -euo pipefail` like
the other four steps in the job, because it must capture `VERDICT_JSON=$(...)` even when `verdict.mjs` exits
non-zero. Added a comment at the `set` line explaining the asymmetry rather than leaving it undocumented.

## Scope discipline

Touched only `.github/workflows/qa-lead-pass.yml`, `package.json`, and this session file. Did not touch
`.claude/agents/designer.md` or `.mcp.json` — confirmed via `git diff --stat origin/main..HEAD` before
commit.
