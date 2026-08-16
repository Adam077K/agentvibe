# Handoff — the harness-completion session, closed

**From:** ceo (`ceo-1-1786880982`) · **Date:** 2026-08-16 · **Base at start:** `main` = `55176ed`
**Supersedes as the current state of play:** [2026-08-16-harness-completion.md](2026-08-16-harness-completion.md)

> Read this before `AGENT-SYSTEM-REBUILD.md` or the prior brief. Both are still correct about
> *intent*; this document is what is **true on disk** after ten branches.

---

## 0 · The one thing to read if you read nothing else

**Nine of ten lanes produced correct work. Four of them reported "available" while their finished
work sat uncommitted on disk.** An idle agent and a finished agent emit the identical signal in this
runtime. Every deliverable in this session was verified by reading the branch, running the command,
or diffing the file — never by believing the return. Four would have been lost otherwise.

`PHASE-8A-CLOSE.md` standing rule 5 — *ask, never infer* — is the single most load-bearing
operational rule in this harness. It earned that four times in one session.

---

## 1 · What shipped, and how it was verified

Eight PRs merged. Every one through the real gate; none merged locally, none with `--admin`.

| PR | What landed | Verified by |
|---|---|---|
| **#62** | `.mcp.json`, `qa.js`, `gate-logic.mjs` → `irreversible + block`; `.claude/workflows/**` → `full`; `.claude/sandbox/**` pre-registered | `classify.mjs` output pasted; `classifier.test.mjs` 24 → 28 |
| **#63** | The false nested-spawn constraint deleted from **both** live prompts | Acceptance grep re-run by CEO: only historical records remain |
| **#64** | `PROMPT-STANDARD.md` — 22 blocking rules, 7 warnings, 4 advisory | Read in full by CEO; §0's calibration greps re-checked |
| **#65** | 8 phantom/shim dispatches repointed + `check-dispatch-agenttype.mjs` | Checker run before/after; 23 tests inc. non-vacuity floor |
| **#66** | #57 · #58 · #59 — three ledger blind spots | 76 → 88 tests; each failure constructed first |
| **#67** | Four measured facts registered as claims; 3 stale counts corrected | `ledger verify` before/after |
| **#70** | #53 · #54 — claim validation at both ledger boundaries | **The mutation pair (§2)** |
| **#71** | The standard becomes `PS-*` lint rules; model line corrected | `schema-lint` 18 pass/0 fail; `npm run check` exit 0 |

**Open at handoff:** #72 (`tools:` binding claim), #73 (MCP hook policy — was `DIRTY`, needs a rebase).
**Issues filed:** #68, #69. **Issues fixed but still open, close them:** #53, #54, #57, #58, #59.

---

## 2 · The measurements that change what you should believe

Each of these was previously unknown, contested, or recorded backwards.

**The `mcpServers:` grant is real and it narrows.** `designer` (declares `[playwright]`) holds **24**
`mcp__playwright__*` tools including `browser_navigate`; `builder` (declares none) holds **zero**.
Both dispatched through the `Agent` path, ~35 seconds. This settles `GRANT-HOLDERS.md` §3.7,
ROSTER-SIZE F1 and §8's X2 simultaneously. **The agent file is the capability boundary.**

**`tools:` binding is verified by attempt.** `reviewer-readonly` was told to genuinely *attempt*
Write, Bash and Edit: all three `NOT_PRESENT` — absent from the tool list, not present-and-refused.
Control read succeeded, so the probe could act. Tool list exactly matched the declaration.
*Absence is the stronger result*: refusal would mean the capability exists and a hook is the only
barrier, and hooks fail. **Bounded:** measured on the `Agent` path; `qa.js` dispatches its judge
through `agent()` on the Workflow surface, which was **not** measured.

**The mutation pair that proves #54** — the cleanest evidence produced all session:
```
BEFORE, index structurally broken:  320 pass · 0 fail
BEFORE, index intact (the control): 320 pass · 0 fail   ← identical
AFTER,  index structurally broken:  172 pass · 1 fail
```

**`qa-lead-pass.yml:117` greps the session file for `qa_verdict: PASS`. Nothing verifies `qa.js`
produced that verdict.** Every merge in this session carries an **author-asserted** verdict,
including the CEO's. The gate blocks reliably — it blocked this session twice — but it blocks on a
*written claim*, not a *gate run*. This is the most important open defect in the harness.

---

## 3 · The CI blind spot — decide this first

**The #59 citation check cannot fail on CI.** With no `~/.warroom/ledger/global.yml` present —
which is *structurally always* true on a runner — `lint` downgrades unresolvable citations to a
warning and exits 0, reasoning that a global claim and a dead id are indistinguishable. That
reasoning is *correct* under Rule 10. The consequence is not: the check enforces on the founder's
laptop and is **inert in the gate**.

Proof it matters: `main` was **red locally and green in CI on the same commit** (`1d0d451`) for
~40 minutes. #64 added a citation; #66 added the check that validates citations; each was correct
alone.

**The fix is already designed** — see issue **#69** and the reference branch
`fix/ledger-blind-spots-2` (do **not** merge it; it predates six merges). Commit the global claim
**ids**, not their content, so a runner can tell "known global" from "dead."

---

## 4 · Traps — every one of these cost this session real time

1. **`WARROOM_EVENTS=$(mktemp)` creates the file.** The run log then reads present-but-empty, the
   sweep files every resolver as silent, and `verify` reports **6** would_block instead of 5. Use a
   path *inside* a temp dir. *(The CEO put this wrong form in three lane briefs.)*
2. **Do not brief a lane to a worktree outside `CLAUDE_PROJECT_DIR`.** `pre-tool-use.sh` correctly
   refuses writes there. The project root is the CEO session worktree; lane worktrees belong at
   `<project-root>/.worktrees/<lane>`.
3. **This repo is registered under two path casings** — `agentvibe` and `Agentvibe`. macOS treats
   them as one directory, git as two worktree entries. This is pre-existing and it is why session
   isolation and `git -C` refusals look arbitrary. **Recommend deregistering one casing.**
4. **Lanes sharing one directory get branches switched under them mid-commit.** It happened twice.
   Both agents recovered without data loss (one used `symbolic-ref` rather than a checkout,
   specifically to avoid clobbering a peer's uncommitted edits). One worktree per lane, always.
5. **A PR touching an irreversible path needs the `risk:irreversible` label, and nothing applies
   it.** `classify.mjs` computes the answer; a human applies it from memory. Forgetting produces a
   red build that looks like a real failure. It blocked this session twice.
6. **Two tests flake under parallel load** and reproduce on pristine `main`: the `crosscheck`
   ledger-verify comparison (`verify --offline` at 60.4s against a 60s collector timeout) and a 5s
   view budget. `c-mission-control-cold-start` straddles its 10,000 ms budget (measured 9,704 and
   15,165 ms). They will make CI look flaky. They are not.
7. **Never `git checkout -- <file>`.** The safety hook blocks it and offers `git stash`. It is right.

---

## 5 · What is NOT done

Named plainly so nothing here reads as finished.

- **The roster body migration.** #71 landed the linter and the frontmatter (`model`, `effort`). The
  eight engine **bodies** have not been rewritten against the standard. This was deliberate — bodies
  get rewritten against an *enforced* standard, not a written one. `schema-lint` reports **8
  warnings**; enumerate them before starting.
- **The OS sandbox.** 100% specification, 0% implementation. **Do not hand-write a `.sb` profile** —
  the binary already implements Seatbelt *and* bubblewrap (verified via `strings` on 2.1.233), and a
  second containment implementation would be weaker and divergent. `IMPLEMENTATION-PLAN.md` §4-A/4-B
  is superseded on this point.
- **The six credentialed MCP servers.** Still absent, and **that is correct**: there is no
  "built but off" state for an MCP server — `.mcp.json` starts a process for every session in the
  repo. They go in **one at a time, after** the sandbox, starting with `db-read` against an export or
  replica, never production.
- **Mission Control 8b (Dispatch).** Design exists (queue file + founder-run consumer; the server
  must **not** spawn, so `crosscheck.test.ts`'s shell ban stays at zero exceptions).
- **The token-efficiency lane** — re-scoped, see §6.
- **`instrument` / `operator`** — blocked on the sandbox, by design.
- **No venture work has ever run through this harness.** Stop condition §6.6 remains live and
  knowingly accepted.

---

## 6 · Token efficiency — the three proposed fixes are not buildable

`TOKEN-EFFICIENCY.md` §7.1–7.3 propose capping tool results, deduplicating repeated reads, and
bounding dispatch prompts, and describe all three as "hook or tool-wrapper level." **Checked against
the Claude Code documentation: none of it is reachable.**

- `PostToolUse` **cannot** modify or truncate a tool result — only observe, add `additionalContext`, or block.
- `PreToolUse` **cannot** rewrite a tool input — allow/deny/ask only.
- There is **no** read-deduplication mechanism at any level.
- The ~25,000-token tool-result ceiling is **not configurable**.
- The Messages-API `context_management` knobs are **not exposed** by Claude Code.

The analysis is not wrong about where tokens go — it is the most rigorous document in the repo. It
assumed a hook could do things the harness does not expose. **Do not build these hooks.** This repo
has already shipped two hooks that ran and did nothing (`budget-guard.js` with no matcher;
`pre-tool-use.sh` parsing JSON with `awk`).

**What remains buildable:** the lens/playbook router (§7 below), dispatch-by-reference as a linted
convention, the `DECISIONS.md` byte trim, and `effort`/model routing — noting that whether the
`effort` **frontmatter field** binds is itself unverified (`c-effort-frontmatter-binding-unverified`).

---

## 7 · Decisions that need the founder

| # | Decision | Recommendation |
|---|---|---|
| 1 | **The `qa_verdict` gap (§2).** The gate checks a written claim, not a gate run. | Highest priority. Make `qa.js` emit a signed//hashed verdict the workflow verifies, or accept that the gate is a documentation check. |
| 2 | **CI global-ledger blind spot (§3).** | Commit global claim **ids** per issue #69. |
| 3 | **#55** — waiver deadlines extendable forever. | Take the **cap**, and index only `first_waived: <date>`, not the whole disposition — a reason edit must not produce an index diff, or the index stops being read. Open question is the number; **90 days** suggested. *(Design credit: the stood-down duplicate lane.)* |
| 4 | **Credential scopes** for `instrument`/`operator` — Stripe restricted vs live, Supabase anon vs service role, whether `operator` touches live payments at all. | Founder-present session, real money. |
| 5 | **OS sandbox: enable or not.** It binds your own sessions. | Build unarmed; arm with `failIfUnavailable: true` and `autoAllowBashIfSandboxed: false`. First armed run should be one deny rule in a throwaway directory, not the full policy. |
| 6 | **The dual path casing** (§4.3) — affects two other live projects. | Deregister one casing. |
| 7 | **`~/.claude/agents/`** — 44 files, 11 shadowing this repo's shims. | Phase 9. **Do not delete the 11 shims**; deletion un-shadows drifted globals silently. |
| 8 | **Mission Control off loopback?** Only if you want it reachable remotely. | **No.** Three RCEs were found in it; loopback is what contains them. |

---

## 8 · How to start

```bash
cd /Users/adamks/VibeCoding/agentvibe
git fetch origin && git status                     # must be CLEAN — it was staged to revert #47 once
cd mission-control && bun install --frozen-lockfile
cd .. && npm run check                             # expect exit 0
node scripts/ledger.mjs verify                     # expect 5 would_block · 0 block
```

Measure from a **clean detached worktree at `origin/main`**, never a working tree. That mistake has
produced wrong readings three times now, including once in this session.

**First moves, in order:** rebase and land #73 (it was `DIRTY`) · close #53/#54/#57/#58/#59 · decide
§7.1 · then the roster bodies.

---

*Written by: ceo · 2026-08-16 · every figure measured, not recalled. Where something was not
measured, it says so.*
