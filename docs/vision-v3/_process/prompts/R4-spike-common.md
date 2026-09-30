# Round 4 — spike (common brief)

You build a **throwaway prototype** that tests whether one of v3's riskiest ideas is real, using **real Claude Code and
Codex runs**. The result — including a negative one — changes the design. Honesty over success: a spike that fails
clearly is worth more than one that passes vaguely.

Context (skim, don't study): `docs/vision-v3/_process/SEAT-CONTEXT.md`, `docs/vision-v3/r1-concepts/R1-SYNTHESIS.md`
(the architecture vocabulary: missions, leases, receipts, Referee, Venture Mind, evidence ladder).

## Workers — both are real and both are equal
- Claude Code headless: `claude -p "<prompt>" --model claude-sonnet-5 --output-format json` (or `stream-json --verbose`
  for live events). Reports `total_cost_usd`.
- Codex headless: `codex exec --skip-git-repo-check -s <read-only|workspace-write> -C <dir> -o <file> "<prompt>"`
  (`--json` for JSONL events). Model is `gpt-6-astra`.
- **Both need the Bash sandbox lifted** (`dangerouslyDisableSandbox: true`) — they read their own config/auth under `~`.
  Lift it only for the commands that launch a worker. Never lift it for anything else.
- **Budget cap per spike: 40 worker launches total and ~$25 of reported Claude cost.** Log every launch (worker, model,
  seconds, cost if reported, exit code) to a CSV. Stop at the cap and report what you have.

## Where you work
- Your own git worktree (path in your brief), on its own branch. Put code under `spikes/<name>/` and the results doc at
  `docs/vision-v3/r4-spikes/<file>.md` **inside your worktree**. Commit there (conventional commits, ending with the line
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`). Do not push. Do not touch any other worktree.
- `bun` and `node` are available. No new services, no network except what the workers themselves need.

## Results doc (6–12 KB)
1. **Hypothesis** — the risky idea, stated so it can fail. **Pass/fail criteria written before running.**
2. **Setup** — what you built (files), the task(s), workers, how measured.
3. **What happened** — table of runs; numbers; notable transcripts (short excerpts).
4. **Verdict** — PASS / PARTIAL / FAIL against the criteria written in §1.
5. **What this changes in the design** — concrete edits to v3 (mechanisms to add, drop, or re-parameterise).
6. **What we still don't know.**

Return a ≤200-word summary: verdict, the 3 most important numbers, and the design changes.
