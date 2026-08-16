# Build brief — complete the harness, one session

**Task:** Finish the agent harness autonomously. **From:** ceo (session `ceo-1-1786445435`) · **To:** the build session
**Date:** 2026-08-16 · **Against:** `main` = `08e7981` · **Priority:** critical path first, everything else in parallel

---

## The instruction

Founder, 2026-08-16, after being given and rejecting the recommendation to stop building and run a real task:

> Keep building the harness. The **processes** are overengineered, not the work. Combine both sessions' state,
> then **one session completes the system autonomously** — as many agents as it needs, no overengineered
> reviews or check-ins — then test it and confirm quality, **without missing any part of the harness.**

**So: cut the ceremony, not the coverage.** Two review rounds maximum, no third. No status check-ins. Report
once at the end. The QA gate still blocks and cannot be overridden — that is the one process that stays,
because it is the one that has never actually run.

---

## Non-negotiable decisions (founder, 2026-08-16 — do not reopen)

| | |
|---|---|
| **PR #47 clears by a REAL `qa.js` run** — not by authorisation, not by bypass label | The gate's first genuine invocation is the change that creates it |
| **Prompt standard first**, then founder approval, *then* anything under `.claude/agents/` | The one human checkpoint. Everything else runs without asking |
| **Scope stops before Phase 9.** No project outside `agentvibe` is touched | Excludes fleet rollout and the 44 global agent files |
| **#56 and `--dangerously-skip-permissions` are delegated to you** — decide and record | Two fewer stalls |
| Build everything; **activate nothing needing founder secrets or binding founder sessions** | MCP credential values and the sandbox switch are one documented step each |

---

## Read in this order

| # | Doc | What it settles |
|---|---|---|
| 1 | [PHASE-8A-CLOSE.md](../../03-system-design/PHASE-8A-CLOSE.md) | Measured state, the defect catalogue, the traps |
| 2 | [2026-08-15-implementation.md](2026-08-15-implementation.md) | The 7-item remaining list this brief supersedes and expands |
| 3 | [AGENT-SYSTEM-REBUILD.md](../../03-system-design/AGENT-SYSTEM-REBUILD.md) §4, §6 | **Authoritative plan.** `IMPLEMENTATION-PLAN.md` is superseded |
| 4 | [GRANT-HOLDERS.md](../../03-system-design/agents/GRANT-HOLDERS.md) §4.7 | What `instrument` and `operator` are for, and their credential sequencing |
| 5 | PR #47 body | Items 1–4 already built; read before duplicating |

---

## Critical path — do these in order, nothing else unblocks without them

```
[11 prompt standard] ──► FOUNDER APPROVAL ──► [12 roster 17→7] ──► [16 MCP wiring] ──► done
        ▲                                            ▲
   start here                                  14+15 must already be in
```

**1 · The prompt standard (item 11).** Write `docs/03-system-design/agents/PROMPT-STANDARD.md` — structure,
length, word choice, anti-sycophancy, the never-appear list — **and a `schema-lint` rule that enforces it.**
A standard with no linter rule is a wish. Then stop and get founder approval. This is the only stop.

**2 · Roster 17 → 7 (item 12).** Rewrite `orchestrator, builder, designer, reviewer, sourcer` against the
standard. Create `instrument.md` and `operator.md`. Delete `framer.md` (safe — no global twin, no `agentType`
references). **Do NOT delete the 11 shims** — see Traps.

**3 · MCP reality (items 14 → 15 → 16 → 17).** In this order, and 14+15 in **one commit**.

---

## Parallel lanes — run these concurrently, before and during the critical path

No two lanes touch the same file. One agent per lane.

| Lane | Items | Owns |
|---|---|---|
| **A · gate engine** | Merge PR #47 (items 1, 2), then 3 (`.claude/workflows/**` into `qa-tier-floor.yml`), 8 (de-duplicate `DIMENSIONS`), 35 (bind the verdict to a commit SHA) | `.claude/workflows/**`, `.claude/qa-tier-floor.yml`, `.github/workflows/qa-lead-pass.yml` |
| **B · instrumentation** | 5 — `stop_reason` into `turnsFrom()`, reindex, cross-tab against empty-return runs | `scripts/lib/usage.js`, `scripts/usage.test.mjs` |
| **C · ledger** | 29 (#55), 30 (#57), 31 (#58), 32 (#59), 23 (`warn`→`fail` on unregistered) | `scripts/ledger.mjs`, `scripts/check-registration.mjs`, `.github/workflows/ledger-sweep.yml` |
| **D · mission-control** | 33 (#53), 34 (#54) | `mission-control/server/projects.ts`, `mission-control/test/**` |
| **E · safety floor** | 21 (`execFileSync('/bin/sh', ...)` injection in `resolvers.js:261`), 22 (register `budget-guard`), 24 (the permissions flag), 25 (sandbox, built-not-enabled) | `scripts/lib/resolvers.js`, `.claude/settings.json`, `bin/warroom` |
| **F · truth** | 26 (delete the false "subagents cannot spawn subagents" constraint — measured false 2026-08-13), 27 (F13 vs `classifier.js`), 38 | `.claude/entry/ceo.md`, `docs/03-system-design/**` |
| **G · skills** | 9 (3 broken skills), 10 (strip `allowed-tools` from the 8 that carry it) | `.claude/skills/**`, `CURATION.yml` |
| **SOLO** | 11, then 12 + 6 + 7 + 13 + 14 + 15 | `.claude/agents/**`, `.claude/hooks/schema-lint.js` |

**`.claude/hooks/schema-lint.js` is the contention point** — items 6, 11 and 15 all edit it. One owner, never concurrent.

---

## Traps — each of these is measured, not theoretical

1. **Deleting the 11 shims is a silent substitution, not a removal.** All 11 have drifted twins in
   `~/.claude/agents/` (`ceo` 313 lines, routing to four retired agents). Deletion un-shadows them and
   **nothing reports an error** — the names keep working and quietly mean the older definition. Blocked on
   Phase 9. **Leave them.**
2. **`.mcp.json` turns `schema-lint` permissive for every agent at once.** `mcpConfigured()` is a repo-wide
   boolean. Ship item 15 (per-agent `MCP_ALLOWLIST`) **in the same commit** as item 14, or every
   `mcpServers:` declaration passes unchecked.
3. **`maxTurns` is in `REQUIRED_FRONTMATTER`.** Delete it from the six agent files and from
   `schema-lint.js:64-74` **together**, or lint fails. It is provably non-binding: declared 20, exceeded in
   196 of 269 runs.
4. **`design.js` and `coding.js` dispatch to six `agentType`s that exist nowhere** — `product-designer`,
   `design-critic`, `backend-engineer`, `frontend-engineer`, `devops-engineer`, `design-polisher`.
   `check-registration.mjs` only scans `.claude/commands`, so workflows escape the phantom-name check.
   Repoint them **before** the roster changes under them.
5. **`research.js:121,134` dispatches `agentType: 'researcher'`** — the one shim a workflow actually uses.
   Repoint to `sourcer` before touching it.
6. **Verify `--dangerously-skip-permissions` semantics before removing it.** The plan itself flags them as
   assumed, not measured. Removing it means every `settings.json` rule becomes live at once.
7. **`register the hook, then make the check fail`** — item 22 before item 23, or `npm run check` goes red
   mid-flight.
8. **Measure from a clean checkout with `bun install` run.** Without it the ledger reports 8 would_block
   instead of 5 and three mission-control claims look like regressions. This produced two wrong readings
   during the close-out.
9. **zsh does not word-split unquoted expansions.** Use `xargs`; `xargs -a` is GNU-only, BSD needs `<`.

---

## Batch these for the founder — do NOT stall on them

Do everything around them, then present all of them **once**, at the end, with your recommendation:

| # | Decision |
|---|---|
| 16 | Which credential scopes to issue (Stripe restricted vs live, Supabase anon vs service role) and whether `operator` gets live payments at all. **Wire everything; leave values blank** |
| 25 | Sandbox egress policy and whether to enable it — it binds founder sessions. **Build it; default off** |
| 27 | F13 or `classifier.js` — two mechanisms compute risk and disagree, while CLAUDE.md claims one classifier |
| 36 | The 44 files in `~/.claude/agents/` — affects two other live projects |
| 37 | Install Codex, or delete CLAUDE.md's Full-tier Codex requirement |
| — | `designer`'s browser grant: give it `playwright` or delete `designer`. Leaving it is the one indefensible option |

---

## Definition of done

The harness is complete when **a dispatch runs through a container that actually constrains it, a gate that
can actually refuse, and a grant that actually exists.**

Concretely, all of these must hold:

- [ ] `npm run check` exit 0 from a **clean detached worktree** at `origin/main`, after `bun install`
- [ ] `node scripts/ledger.mjs verify` → `0 block`, and every `would_block` has a recorded `disposition`
- [ ] **`qa.js` has actually run and actually refused something** — plant a P1 in a scratch diff, gate goes
      red; remove it, gate goes green. Paste both.
- [ ] `node scripts/classify.mjs .claude/workflows/qa.js` → `full` or higher
- [ ] Zero `maxTurns` in the repo; `npm run lint:agents` exit 0
- [ ] 7 agent files, each conforming to the approved prompt standard, each passing the new lint rule
- [ ] Every `agentType` dispatched anywhere resolves to a file in `.claude/agents/`
- [ ] `.mcp.json` exists **and** an un-allowlisted `mcpServers:` declaration fails lint
- [ ] An `mcp__*` payload through `pre-tool-use.sh` exits 2 rather than falling through to `allow`
- [ ] `git grep "subagents cannot spawn"` returns only historical records
- [ ] Session file with `qa_verdict: PASS` per merged PR, tier declared

**Report once, at the end.** State what you did not cover and what you could not verify — a report that reads
uniformly confident is worth less than one that marks its own soft spots.

---

*Written by: ceo · 2026-08-16 · against `main` = `08e7981` · inventory of 39 items measured, not recalled*
