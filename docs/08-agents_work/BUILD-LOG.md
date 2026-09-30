# v3 BUILD LOG

One line per merged job: `date · job · PR · what landed · what's next`. Decisions that affect other jobs are marked
**DECISION**. Plan: [14-BUILD-PLAN.md](../vision-v3/14-BUILD-PLAN.md) · brief: [HANDOFF-BUILD-PROMPT.md](../vision-v3/HANDOFF-BUILD-PROMPT.md).

## Session build-1 — 2026-10-01 (orchestrator, Opus 5.5)

- **DECISION — Claude-only this session.** `codex exec` (needs the Bash sandbox lifted to read `~/.codex`) was refused
  by the auto-mode classifier ("Safety Bypass Flag"). Per brief §6 not worked around. Consequence under G1: full-tier
  PRs cannot merge (need an other-family verdict) and stay open marked `codex_review: owed`; lite/trivial PRs merge on
  a non-builder Claude reviewer (different model from the builder where possible). Every merged PR is listed in
  HANDOFF-NEXT as owing a Codex re-review.
- **DECISION — worktrees via the Agent tool's `isolation: worktree`.** Unsandboxed `git worktree add` was
  classifier-refused; sandboxed it fails on `.claude/**` (documented wall). Harness worktrees land in
  `agentvibe/.claude/worktrees/agent-*`; each job branches `build/<job-id>` off `origin/main` inside it.
- **DECISION — Go 1.27.1 installed via Homebrew** (canon 09a pins Go 1.25+; module `go` directive stays 1.25).
- **DECISION — B0-00 runs non-exhaustively.** "Run until the window throttles" would spend the build session's own
  window; B0-00 v0 records per-job turns/wall-clock from this session's receipts and leaves the throttle arm for a
  dedicated measurement session.
- **DECISION — PCB jobs follow the classifier.** 14 §7 says PCB lands founder-present; the later founder grant G1 scopes
  merge authority by the classifier tier. `kernel/**` classifies `lite` today, so kernel PRs merge under G1 — but only
  with a non-builder verdict — and a tier-floor proposal (`kernel/** → irreversible`) is left open for the founder.
- **DECISION — Bash writes are sanctioned inside a job's own harness worktree.** `pre-tool-use.sh` anchors Edit/Write
  to the session root (`.worktrees/ceo-3-…`), so it refuses the harness worktrees under `agentvibe/.claude/worktrees/`;
  the sandbox allowlist names exactly those paths. Per CLAUDE.md's per-path rule for Bash/Write divergence, the sandbox
  is right for these paths. Nowhere else. Durable fix (hook learns this session's harness worktrees) is harness
  self-edit → irreversible → founder.
- **DECISION — no merges this session.** Recording a QA verdict from an orchestrator-dispatched finisher agent was
  refused by the auto-mode classifier ("CI Bypass"). Not worked around. Every reviewed job becomes a PR carrying the
  reviewer's evidence; the founder records the verdict (or re-reviews) and merges. Downstream jobs build on stacked
  branches instead of `main`.
- **Tool-use note:** a sandboxed `git worktree add` inside the session root still hits 35 denials on
  `.claude/**` (re-measured 2026-10-01), so the documented wall stands.
- **Blocked on the founder:** B0-05 (second macOS user), B0-06 (Apple `container` not installed), B0-08/09/10/11
  (headless worker launches refused), B0-21 (founder-driven V0), F1 grant + Build Charter signature.

| Date | Job | PR | Landed | Next |
|---|---|---|---|---|
| 2026-10-01 | B0-15 | — | already resolved on `main`; CLAUDE.md bullet reconciled on the session branch | — |
| 2026-10-01 | B0-01 | #139 (draft) | v3 slice squashed onto main; 47/48 — `test:probe-readonly` census "of 94" needs a founder design decision | founder: re-settle census, Codex review (full tier) |
| 2026-10-01 | B0-07 | #140 | spike `unresolved`; nested rerun commands for an unsandboxed shell, dated 2026-10-02; conditional I3 fallback in B1-10 | founder: run rerun, record verdict |
| 2026-10-01 | B0-02 | #141 | provider registry v0, 15/15 hashes verified; Claude headless `unclear`, Codex `yes-conditional` | B0-00 measures caps; B0-20 wires launches.csv |
| 2026-10-01 | B0-13 | #142 | build/jobs.yml (143) + capabilities.yml + lint (10 tests) | wire into check-suite (irreversible follow-up); B0-17 uses it |
| 2026-10-01 | B0-19 | — | **abandoned first attempt** (sonnet, 96 tool calls, nothing committed, test file does not parse); draft left untracked at `.claude/worktrees/agent-adef12bfff3252fb4/kernel/internal/secretscan` | relaunch on opus off the final `build/b0-16` |
