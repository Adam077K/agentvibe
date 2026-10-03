# DR — Build speed rules (2026-10-03)

**Decided by:** the founder delegated these calls to the orchestrator ("make the decisions needed to move faster, but stay safe").
**Why:** B1 jobs took 4–7 review rounds each. Most findings were new attack classes found late, plus real-CLI behaviour that nobody had measured before the tests were frozen.

## Rules, effective from the next job

1. **Red-team the tests before any code.** After a test builder freezes the done-tests, a separate Opus reviewer attacks the TESTS, not the code: "what wrong implementation passes these?" The test builder closes every gap and re-freezes. Only then does the implementer start.
2. **Measure real tools first.** Any job that wraps a real CLI or service (claude, codex, git, deploy, mail) starts with a measurement pass:
   - use a throwaway HOME;
   - never run a model turn;
   - never touch the real network;
   - record the results in the job's DR.

   All founder questions for the job are asked in ONE batch, before tests are frozen.
3. **Ship bar.** A job ships when the Opus review has **no HIGH and no MED-security** findings. These go to the follow-up list in HANDOFF-NEXT, not to a new round:
   - LOW findings;
   - fail-safe MED findings (refuse more, never grant more);
   - surviving mutants judged low-risk.
4. **Parallelism.** Run up to 6 independent jobs at once, where none depends on another's unmerged code. Keep the Kernel budget in view: sum the expected line deltas before dispatching.
5. **Batch merges.** Collect passed PRs and give the founder one merge-train run per batch.
6. **Cross-family review.** When `codex exec` works non-interactively, run Codex as a second reviewer in parallel with the Opus reviewer on every PR. This pays down the cross-family debt the plan requires. If Codex is unavailable, ship on the Opus review and add the PR to the cross-family debt list.

## Unchanged, because safety does not move
- Frozen tests are written by a non-implementer. Re-freezing needs a dated reason.
- Every job gets a separate reviewer who tries a wrong implementation.
- A hook or classifier refusal means stop and record it. Never re-encode it, including by stash.
- The orchestrator never records its own verdict. The founder runs the merge.
- Go builds run offline only.

## Not decided here (founder, irreversible tier)
- **Raising builder `maxTurns` from 30 to about 60.** It edits `.claude/agents/*.md`, which is harness self-edit. Propose it as its own PR.
- **Until then:** briefs tell agents to batch commands, and the orchestrator resumes any agent that stops at its turn limit with "commit, continue, batch".
