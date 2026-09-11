---
date: 2026-09-11
role: builder
task: zero-ceo-restore-refusal
tier: irreversible
qa_verdict: NOT_RUN
branch: ceo-1-1788609834
head: 683328b
---

- `db5406f` — a snapshot that is valid JSON and yields nothing to build now refuses BEFORE `tmux kill-session`. `{}`, `{"ceos": []}` and a missing `ceos` key each destroyed the running war room and printed `✗ No CEOs could be restored.` afterwards; measured before the fix as one kill-session, exit 1, stderr empty.
- **The guard is the resolved set, the message is the input count** — two questions, different right answers. "Nothing to build after the kill" is a property of `$snapshot_ns`, so a future silent drop reason is caught without anyone extending the condition; but `$snapshot_ns` is equally empty for a file with no CEOs and one with five unusable ones, so the wording comes off a new `CEOS` tag. Measured that they diverge on a real input: all-entries-unusable reports `CEOS 2` with an empty `NS`. My first version keyed the guard on the count and was wrong.
- `%r` on the `ENG` line was REJECTED as the briefed fix: it quotes the value against a bash matcher expecting `*" ${_n}:"*`, so every pane would have come up on a resolved default instead of its recorded engine — a silent engine swap on every restore, proposed during a correctness review. Shipped `elif eng and n in ns:` instead.
- `683328b` — `cmd_broadcast`'s test did not constrain the property in its own name. Its fixture put `CEO-08` first, so an up-front sweep and a per-iteration check were indistinguishable. New fixture ordered `['CEO-1', 'CEO-08']`; the mutation now reddens it while the existing test stays green, and that contrast is the finding.
- Mutations, each watched: delete the guard → 104/3, all red on kill-session and not on status or stderr; drop the `CEOS` tag → red on naming, GREEN on kill-session; remove the `BAD` refusal → the intentionally-unreachable third arm fires with no kill. `check:warroom` 122/0 · `npm run check` 48 of 48, 0 failed, exit 0 at `683328b`.
- **The only control that held was a judgement, and nothing here would have caught its absence.** Three agents wrote into one worktree. I found an unattributable uncommitted hunk in `bin/warroom` (a reviewer's live mutation), refused to write, and worked test-first until it cleared — had I worked production-first, the reviewer's restoring `cp` would have destroyed the work and `git log -S` is silent either way for an uncommitted edit. Two teammates then reasoned from `0991458`, a sha I had amended away, and concluded work was missing that had landed 40 minutes earlier. Sample `git rev-parse HEAD` in the same breath as the state you quote.
- Known, unfixed, not mine: `bin/warroom:3298` still prints its refusal after the kill on the documented missing-branch arm. `docs/08-agents_work/sessions/2026-09-10-ceo-codex-fleet-rollout.md:41` claims `check:warroom 121→124` at `683328b`; I measure 122, and 118 baseline + 4 tests cannot reach 124.
