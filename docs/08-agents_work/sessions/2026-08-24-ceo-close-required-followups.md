---
role: ceo
task: close-required-followups
date: 2026-08-24
branch: ceo-2-1787566829
tier: irreversible
qa_verdict: NOT-RUN
gate_run: false
gate_blocked_by: "check:mc fails ONLY under the armed sandbox — a denied loopback bind() surfaced by Bun as EADDRINUSE with errno 0 (a real one is 48). Two cells, same commit, Bun 1.3.10: sandboxed 344 pass/1 fail, unsandboxed 345 pass/0 fail. Not a mission-control defect. Clearing it needs sandbox.excludedCommands in .claude/settings.json, which the permission classifier refuses to an agent and which the orchestrator does not implement. Founder decision taken, edit not yet applied."
branches_ready: [fix/pr1-sandbox-worktree-ci, fix/pr2-flush, fix/pr3-figures, fix/pr4-checkrunner]
---

# Session — close the four REQUIRED follow-ups

All four handoff follow-ups closed across 24 commits on four disjoint branches; merged into `integration/all-four`, **30 of 31 steps pass**, the sole failure being `check:mc` above. Nothing merged: no gate run, no PASS.
**(a)** worktree protocol and the lint predicate moved together — `builder.md` now tells a builder the command exits 128, that it is not their mistake, and to ask the dispatcher. **(b)** `ci.yml` bypass closed; preloaded scripts reaching CI 16→18 named, 25/25 reachable. **(c)** 64KB truncation closed in **six** emitters, not the two briefed; `check-citations.mjs` was the live one — its existing `writeSync` "fix" returns a short count without throwing at 288,412 bytes. **(d)** diagnosed, not fixed; `stream.test.ts` correctly left alone.
**Unbriefed and larger than the brief:** `npm run check` chained 30 steps with `&&` and `check:mc` sat at 21, so a single run never reached `test:sandbox`, `test:pre-tool-use` or the gate's own tests — and **the oracle runs `npm run check` as one command**, so the deterministic floor had a nine-step hole behind a failure that was never a real defect. Founder chose the class fix; PR-4's runner now runs all 31 and names each failure.
**Sourced, closing two open questions:** `allowWrite` can never lift `.claude/**` protection (vendor: "no way to exempt one of these paths"), which is why session worktrees cannot be synced — this one was **170 commits behind** — and why the previous session shipped a line cite from a stale tree.
**Corrections to my own briefs, all caught by the builder receiving them:** wrong worktree path (×3 builders), a tripwire sentence misstating the failure condition, and I twice ran a command that returned a well-formed answer to a different question (`$?` through a pipe; `set -- $pair` under zsh, which does not word-split) — then misread a peer's A/B window as unfinished work and said so. **Four defects of mine, zero found by a check.** Second week running that the orchestrator's brief is the noisiest surface here and nothing reviews it.
**The pattern, in pr3's words, and it covers every defect found today:** *the failure is silent because the wrong answer is well-formed — a wrong path errors, a wrong tree does not.*
