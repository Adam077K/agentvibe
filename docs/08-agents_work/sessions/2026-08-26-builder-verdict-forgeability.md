---
date: 2026-08-26
role: builder
task: verdict-forgeability
branch: fix/qa-verdict-forgeability
worktree: .worktrees/verdict-forgeability
pr: 109
tier: irreversible
qa_verdict: PASS
---

# Close what can be closed about verdict forgeability, and state what cannot

`.github/workflows/qa-lead-pass.yml` documented its own weakness and nothing had closed it.
I established the guarantee by execution rather than by reading the comments, closed the one
half that was closable in a file, and wrote the true statement for the half that is not.

## decisions

- **Bound the bypass to the diff it bypasses.** The PASS path was bound to `sha256(diff)`; the
  OVERRIDE path was bound to nothing. Label + one `BYPASS REASON:` comment authorised the diff
  present when written *and every later push to that PR* — sticky label, immutable comment,
  nothing recomputed on `synchronize`. This is the class this file already had removed twice
  from the PASS path (slug-matched sessions 2026-08-15; grepped session prose 2026-08-23). The
  override branch was never swept for it. A bypass comment must now carry the 12-char subject,
  which the failing check-run it responds to already prints.
- **Did not add any in-repo control against forgery, deliberately.** Every file here is inside
  the diff being judged, so a control a PR can edit is not a control over that PR. Shipping one
  would be a control that reports green without controlling.
- **Did not build the `workflow_run` verifier** that would genuinely resist head edits (a
  `workflow_run` workflow executes the default-branch copy). It is a second gating workflow —
  an architectural decision this brief did not make — and it is inert until the founder adds
  its name to required contexts. Named as a residual instead of half-built.
- **Did not execute the check-run forgery.** Demonstrating it means posting a forged required
  check on the live gate other lanes are merging through.

## corrections

- **The header was false in the rare direction — it understated enforcement.** It said this job
  is not a required check "until it is required". It is: `contexts = ["Deterministic checks",
  "Verify QA Lead PASS"]`. Corrected, with the warning that the job's `name:` IS the context.
- **The remedy named in the file was too narrow.** It named CODEOWNERS on
  `.github/workflows/**`, reasoning forgery requires editing that file. Check-runs posted by
  `gh api` inside a workflow are attributed to `app_id=15368 / github-actions`, identical to
  real job checks, and two of one name coexist on PR #108's head. Any *new* workflow can post
  `Verify QA Lead PASS` = success. The remedy must cover `/.github/`.
- **"Signed check-run" was an overstatement** in a step name and in the PASS output. Nothing
  signs anything; a token authenticates the poster.
- **`required_approving_review_count` is 1, not absent.** The parent protection object omits the
  block; the sub-resource returns it. Control: `restrictions`, also absent from the parent,
  404s. But `enforce_admins: false` exempts the only account that authors and merges here, so
  the requirement does not bind on the flow actually used.
- **`vars.ADAM_GITHUB_USER` is unset** (`total_count: 0`), so the bypass path is inert today —
  applying the label fails the job rather than passing it. Fail-closed, but the documented
  escape hatch does not work.
- **`--paginate` was missing** on the bypass comments query: a comment past the 30th was invisible.
- **My own base moved mid-lane.** `origin/main` printed `244e8db` at the start and `47dbbd6`
  when I cut the worktree. Fast-forward, docs-only, neither target file touched; `strict: true`
  requires the newer tip anyway.

## claims_touched

None registered. The three answers below are candidates the orchestrator may register; I did
not register them because two are about GitHub's behaviour rather than this repo's code, and
`c-*` claims here carry resolvers that would have to reach GitHub.

## What was executed

| Question | Answer | Evidence |
|---|---|---|
| Can an author forge a PASS for their own diff? | **Yes** | Fixture: `check` → `absent`/exit 1 (control), `record` → exit 0, `check` → `ok:true tier:irreversible` exit 0. `by`/`evidence`/`run_id` are never validated |
| Does the PR head's workflow definition run? | **Yes** | Run `32971785103` step [9] reported this branch's step name; `origin/main` names it differently |
| Is the check-run load-bearing? | **No** | Not in required contexts; `grep` finds it written and never read |
| Does the bypass binding hold? | **Yes** | Shipped step extracted from the YAML, 6 cases: unbound bypass REFUSED, wrong-subject REFUSED, right-subject bypassed (control), genuine PASS passes (control), silence refuses |
| Full suite | **46/46, 0 failed** | `npm run check`, 214.9s, in this worktree |

## Residual, stated plainly

**This gate cannot be made unforgeable by any change to this repository's files.** It establishes
that a file named for `sha256(diff)` saying PASS is committed on the branch — not that a review
happened, nor that the code that judged is the code in the file. Closing it needs, in order:
`enforce_admins: true` (without it the rest is decoration), `.github/CODEOWNERS` covering
`/.github/` plus `require_code_owner_reviews: true`, and `require_last_push_approval: true`.
All four are repository settings only the founder can set.

Per the standing rules: this is one author and one model family recording a PASS on an
`irreversible`-tier diff. That is not the tier being met, and the lane's own subject matter is
why it is worth saying twice.
