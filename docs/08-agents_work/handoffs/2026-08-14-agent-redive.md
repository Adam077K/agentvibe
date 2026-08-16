# Handoff: Agent Architecture Re-dive

**Task:** Run the agent-architecture board and produce the roster specification
**From:** ceo (session `ceo-2-1786445435`)
**To:** the next ceo session
**Date:** 2026-08-14
**Priority:** High

Start here, then read [AGENT-ARCHITECTURE-REDIVE.md](../../03-system-design/AGENT-ARCHITECTURE-REDIVE.md).
Those two documents are sufficient — nothing else needs to be reconstructed.

---

## Context

The roster was never designed. It was **derived by subtraction**: 26 agents collapsed to 6 engines + 11 shims
in Phase 4b because 26 files contradicted each other, not because six is the right number for the work. The
founder's ask is the first-principles pass nobody has done — *what types, permissions, jobs, tasks, tools,
layers, orchestration system, decision making, thinking, critical thinking for the best outputs* — with the
end goal being a system that can run a real project, startup or business, walkable from the terminal, at
variable autonomy, without sycophancy.

Two boards already ran (rethink, then implementation planning). This is the third and it is narrower and
deeper: it is about **the agents themselves**.

## Current State

- **Branch `ceo-2-1786445435`, synced to `origin/main` = `30f6c35`.** Fast-forward, no divergence.
- **Phase 8a is COMPLETE.** All five Mission Control PRs merged (#21, #26, #27, #30, #32). Seven views over
  ~2,000 sessions and 19 projects. Phase 8b (Dispatch) remains deferred behind Phase 9.
- **9 uncommitted files**, listed under Key Files. Nothing is committed — the founder has not authorised it.
- **`npm run check` exits 0** on this branch after `bun install` in `mission-control/` — full chain, 45/45 on
  the hook suite. But two known flakes can fire on any run and are **not** your changes:
  `crosscheck.test.ts:238` asserts a cache file's mtime is unchanged while other live sessions rewrite it, and
  the ledger crosscheck's 30s timeout sits under its real 10–17.5s cost. Both documented in
  `2026-08-13-ceo-remove-budget-ceiling.md`. **Do not attribute either to your own work.**
- One stash entry: `generated map, regenerating after sync` — `CODEBASE-MAP.md` only, safe to drop after
  running `npm run build:map`.

## What Was Done

- **Two boards run and catalogued.** 13 dimensions, 65 findings surviving 3-lens adversarial verification
  (16 P1 / 39 P2) → `2026-08-13-rethink-board.md`; then 14 layers / 137 steps → `IMPLEMENTATION-PLAN.md`.
- **The safety floor was rebuilt — the single behavioural change in this branch.** `pre-tool-use.sh` was
  parsing `tool_name` with `awk -F'"'`, line-oriented text matching over JSON. On Claude Code's actual compact
  payload, field 4 lands on `session_id`'s value, `case` falls through to `*)`, and **every rule was skipped —
  the hook blocked nothing in normal operation.** Replaced with one structural parse that fails CLOSED, plus
  split-flag normalisation (`rm -r -f` ≡ `rm -rf`), path scoping (deny-by-default outside the project root),
  destruction that never spells `rm` (`git clean -fdx`, `git checkout .`, `find -delete`, `node -e …rmSync`),
  and secret **reads** (`cat .env` was permitted while `Write .env` was blocked — protected one way, leaked
  the other). New test `scripts/pre-tool-use.test.mjs`: 45 cases, red-first, every dangerous case run through
  **both** payload encodings with a barrier test proving the encoders differ. **12/42 → 45/45.**
- **Then found and fixed a bug in that fix.** The path-scoping check compared `_abs` against `_root` with a
  case-**sensitive** `case` glob. macOS is case-insensitive but case-preserving, and this repo is reachable as
  both `agentvibe` and `Agentvibe` — so the guard refused writes that were genuinely inside the project.
  Containment is now decided by **device+inode identity** (`-ef`, walking up from the target), which lets the
  kernel settle case folding and symlinks instead of guessing at either. Two adjacent holes closed with it: a
  new file in a not-yet-existing subdirectory used to be refused, and a symlink whose final component pointed
  outside the project was scoped by the link's own location rather than its target. Three tests pin all three.
- **The re-dive was planned** — `AGENT-ARCHITECTURE-REDIVE.md`. **It was not run.** That is your job.
- **Two earlier findings were retracted after verification** — see Gotchas. Both were mine.

## What Remains

1. **Read `AGENT-ARCHITECTURE-REDIVE.md` end to end.** §1 carries three corrections that change the answer;
   starting without them wastes a board.
2. **Run the board.** 5 process-walkers (P1–P5) + 9 architecture layers (A1–A9), then 2 hostile critics per
   spec, then one `framer` synthesis. Use `agentType: 'Explore'` for finders — read-only by tool grant and
   free of `reviewer`'s 20-turn cap (see Gotchas).
3. **Produce `docs/03-system-design/AGENT-ARCHITECTURE.md`** — the roster spec. §2 of the plan defines what
   "specified" means; §7.4 is the completeness test.
4. **Write the session file** `docs/08-agents_work/sessions/2026-08-14-ceo-agent-redive.md`.
5. **Bring the open decisions to the founder** — listed under Open Questions. Do not decide them alone.

## Key Files

| File | Why It Matters |
|------|----------------|
| `docs/03-system-design/AGENT-ARCHITECTURE-REDIVE.md` | **The plan. Read first.** New, uncommitted |
| `docs/08-agents_work/2026-08-13-rethink-board.md` | 65 verified findings — the evidence base. New, uncommitted |
| `docs/03-system-design/IMPLEMENTATION-PLAN.md` | 137 steps. **Phase 2 is invalidated** — it optimises dollar cost. New, uncommitted |
| `.claude/hooks/pre-tool-use.sh` | The rebuilt safety floor. Modified, uncommitted, `tier: irreversible` |
| `scripts/pre-tool-use.test.mjs` | 42 cases pinning it. New, uncommitted |
| `package.json` | Adds `test:pre-tool-use` to the `check` chain. Modified, uncommitted |
| `docs/08-agents_work/sessions/2026-08-14-ceo-safety-floor.md` | **Its §3 is retracted** — see Gotchas |
| `docs/08-agents_work/sessions/2026-08-13-probe-nested-spawn.md` | Measured proof that nesting is not blocked |
| `docs/08-agents_work/sessions/2026-08-13-ceo-remove-budget-ceiling.md` | Why there is no budget ceiling, and what it cost |
| `.claude/agents/reviewer.md` | `maxTurns: 20` — the silent-truncation trap |

## Decisions Already Made (Don't Revisit)

- **Token cost is not a constraint.** Claude Max $200 subscription, not metered API. The binding resources are
  rate-limit headroom in the rolling 5h window, wall-clock, and context. **Always use the most capable model
  that fits.** Cost arguments are inadmissible in the board.
- **`builder` and `designer` run on Opus** — founder instruction.
- **The harness is the product.** Findings are product defects, not compliance failures.
- **Anti-sycophancy is a requirement, not a preference** — mechanisms, not instructions.
- **`budget-guard.js` stays unregistered** — founder-instructed in PR #29. Do not re-arm it. If a session
  bound is needed, design a new one; A2 owns that question.
- **Nothing is committed without the founder's say-so.**
- **Phase 8b stays deferred** behind Phase 9.

## Open Questions (Needs Decision)

- **Plan step 0-A — the resolver shell.** Replacing `execFileSync('/bin/sh', ['-c', ev.cmd])` with an argv
  allowlist would turn ~6 live claims `unresolved` (`! grep -q …`, `test ! -d …`, a pipe into `grep -q`, `&&`
  chaining) and **take the ledger red.** Executing repo-authored commands is the resolver's purpose, like an
  npm script; the trust boundary is the tier gate on claim-carrying paths. Needs a decision, not a patch.
- **Plan step 0-D** — remove `--dangerously-skip-permissions` from `bin/warroom:235,237`. Highest blast
  radius in the plan. Awaiting founder sign-off.
- **Does the OS sandbox move ahead of Waves B–C?** A3 should answer with evidence; the original argument for
  moving it up has been **retracted** (see Gotchas), so this is genuinely open again rather than urgent.
- **Whether to commit this branch as-is** before the board runs. The safety-floor fix is `tier: irreversible`
  and currently exists only in this worktree.

## Gotchas / Watch Out For

- **Two of my findings were wrong. I corrected both; don't re-inherit them.**
  1. *"A read-only agent disarmed the permission model at 23:42."* **Retracted.** It was PR #29 (`5290edd`,
     2026-08-13 **23:40:07**), founder-instructed and merged — two minutes before the mtime I read as an
     intrusion. There was no escape. `c-read-only-binding-unverified` remains genuinely unprobed and its
     2026-09-08 waiver stands. `2026-08-14-ceo-safety-floor.md` still contains the wrong version;
     `AGENT-ARCHITECTURE-REDIVE.md` §1.4 is the correction.
  2. *"Nested spawning is blocked."* This one is in **the CEO's own operating instructions** and is false —
     measured twice. The entire **T2 dispatch-packet tier rests on it.** See §1.3.
- **`maxTurns` does not bind — do not reason from it.** I claimed `reviewer`'s `maxTurns: 20` truncated 10 of
  14 finders in the first board. **Measured: 196 of 269 `reviewer` runs exceeded 20 turns, max observed 68.**
  The cap never fires. Rewiring those finders to `agentType: 'Explore'` did fix the run (4 → 13 dimensions,
  15 → 65 findings) — so **the fix was right and my explanation of it was wrong**, and the real cause is still
  open. `effort` is what actually binds depth, and `claude-sonnet-4-6` — pinned in all five
  producing/reviewing engines — is hard-clamped to `high`, unable to reach `xhigh`.
  **Still use `Explore` for finders**; it works. Just don't cite the cap as the reason.
- **Every worktree needs `bun install` in `mission-control/`** before `npm run check`, or typecheck fails on
  the React client deps. This is documented and still catches people.
- ~~**Never edit files carrying claim blocks** — `PHASE-8A-STATUS.md`, `mission-control/README.md`,
  `CLAIM-LEDGER.md`, `ledger-canary.md`. Editing moves `source_line` and fails `ledger build --check`.~~
  **No longer true.** The index stopped recording `source_line`, so these files are safe to edit; changing
  a *claim* still fails the check, by design. Positions come from `node scripts/ledger.mjs locate <id>`.
- **Never hand-edit generated files** — `.claude/ledger/index.json`, `CODEBASE-MAP.md`. Regenerate:
  `npm run ledger:build` **then** `npm run build:map`, in that order.
- **`PHASE-8A-STATUS.md` is stale** — it still reads "PR3 of 5 merged" with PRs 4 and 5 "not started", though
  both merged. It carries claim blocks, so fixing it is a deliberate act with a line-number cost, not a
  drive-by edit.
- **The hardened hook's path scoping resolves the project root from `CLAUDE_PROJECT_DIR`**, which can differ
  from the worktree you are working in — a restarted session resolved to a sibling worktree and the hook
  refused my writes. That is the guard behaving correctly; know it exists before you fight it. **It also
  blocks `git checkout -- <file>` and points you at `git stash`** — intended.
- **Tests that shell out must pin `CLAUDE_PROJECT_DIR` explicitly.** `pre-tool-use.test.mjs` inherited it, so
  every scoping assertion silently depended on which worktree launched the run. That is how the case bug
  surfaced — as a test that passed in one worktree and failed in another. `runHook` now pins it to `REPO`.
- **`npm run check` clears the old budget counter as a side effect** of writing ledger claim-events. Irrelevant
  now that the guard is unregistered, but it explains odd notes in older session files.
- **`/board-meeting` is broken** — it instructs spawning 8 agents deleted 2026-08-12, and
  `check-registration.mjs` passes it green because its denylist covers a *prior* incident's names. Build the
  board from the live roster (`orchestrator`, `framer`, `sourcer`, `builder`, `designer`, `reviewer`) plus
  `Explore`, driven through the `Workflow` tool.

---

_Handoff written by: ceo | Date: 2026-08-14_
