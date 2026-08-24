---
name: worktree-isolation-pattern
last_updated: 2026-05-17
description: "The exact git worktree create, detect, and clean pattern for Agentvibe workers: detect-or-create from main-repo-root, child worktree commands, branch naming conventions (feat/fix/chore), atomic commits, and .worktrees/ gitignore enforcement."
tags: [git, agentvibe-specific, workflow, workers]
source: agentvibe-authored 2026-05-16
risk: low
---

# Worktree Isolation Pattern

> ## Corrected 2026-08-24 — the anchor moved from `$MAIN_REPO` to `$PROJECT_ROOT`
>
> This file taught `$MAIN_REPO/.worktrees/<slug>`, where `MAIN_REPO=$(git worktree list | head -1 | awk
> '{print $1}')`. It is now **`$(git rev-parse --show-toplevel)/.worktrees/<slug>`** throughout, matching
> `CLAUDE.md` § *Git Worktree Protocol*, which is the authority if the two ever disagree again.
>
> **Why the old anchor was wrong:** an agent's `Write`/`Edit` are scoped to its **session project root**,
> and in this harness that root is itself a worktree — so `$MAIN_REPO` is *above* it and every child
> worktree this file produced landed where its own tools are refused. Measured 2026-08-24: the old path is
> refused by `.claude/hooks/pre-tool-use.sh` by name; the corrected path is allowed.
>
> Step 3 used to close with *"Never run `git worktree add` from inside a worktree path. Always reference
> `$MAIN_REPO`."* That was the wrong rule for the right worry: what makes the command safe is the
> **absolute path**, not where you run it from or which flag you pass. Running it from inside a worktree is
> the normal case here.
>
> **Not fixed by either path:** under the armed sandbox `git worktree add` cannot complete at *any*
> location — the checkout must write `.claude/agents/**`, `.claude/commands/**` and `.mcp.json`, which the
> runtime refuses. Exit 128, 32 denials, branch left behind, no worktree. That step needs escalation, and
> hitting the wall is not the running agent's mistake.
>
> The frontmatter `description` above still says *"detect-or-create from main-repo-root"*. It is stale for
> the same reason the body was, and is left for a follow-up: it is copied verbatim into
> `.claude/skills/MANIFEST.json`, so correcting it means regenerating that file too.

## Quick reference

> Every code worker creates a fresh worktree under `$(git rev-parse --show-toplevel)/.worktrees/<slug>` —
> its own toplevel, never the main repo. Never edit the main repo. Never edit another worker's worktree.

## When to use

- Any code worker (backend-engineer, frontend-engineer, database-engineer, etc.) starting a new task
- CTO creating a worktree on behalf of a worker via Task
- Debugging "file not found" or "wrong branch" errors in a worker session
- Authoring a new worker agent file that needs the worktree operating procedure

## When NOT to use

- For non-code workers (technical-writer, researcher — no worktree needed)
- For QA-Lead (QA-Lead reads, does not create worktrees)

## Step 1: Detect current context

Run this before any `git worktree add` command. You are probably already inside a worktree — that is the
normal case in this harness, not a problem to correct.

```bash
git worktree list
# Output example when INSIDE a worktree:
# /Users/adamks/VibeCoding/Agentvibe                      abc1234 [main]
# /Users/adamks/VibeCoding/Agentvibe/.worktrees/ceo-1-xxx  def5678 [ceo-1-xxx]

# The FIRST line is the main repo root. It is NOT your anchor — see Step 2.
pwd  # confirm current directory
```

## Step 2: Get your own toplevel

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
echo "Project root: $PROJECT_ROOT"
```

`--show-toplevel` returns the root of the worktree containing your cwd, which is the boundary your
`Write`/`Edit` may reach. Run it from a cwd **inside** your session project root: run it from the main
repository above your root and it returns *that* path, reproducing the defect this correction removed.

## Step 3: Create the task worktree under your own toplevel

The absolute path is what makes this safe. No `-C` flag is needed, and being inside a worktree is fine.

```bash
TASK_SLUG="scan-rate-limit"  # matches Linear ticket slug
BRANCH_PREFIX="feat"          # or "fix" or "chore"

git worktree add \
  "$PROJECT_ROOT/.worktrees/$TASK_SLUG" \
  -b "$BRANCH_PREFIX/$TASK_SLUG"

# Verify
ls "$PROJECT_ROOT/.worktrees/$TASK_SLUG"
```

> **Expect exit 128 under the armed sandbox.** Measured 2026-08-24 at this corrected path: 32 ×
> `Operation not permitted` across `.claude/agents/**`, `.claude/commands/**` and `.mcp.json`, then a
> failed index reset. No worktree survives; the branch is left behind because `git worktree add` creates
> it before checking out. Escalate that one command (create with the sandbox disabled) and work inside the
> result normally. A partial tree from this failure is a known limit, not the agent's own broken work.

## Branch naming

```
feat/<task-slug>     — new feature or addition
fix/<task-slug>      — bug fix
chore/<task-slug>    — cleanup, dependency update, refactoring
test/<task-slug>     — test-only changes (test-engineer, qa-engineer)
```

Slug format: lowercase, hyphens, matches the Linear ticket slug. Example: `feat/scan-rate-limit` for BMX-101.

## Step 4: Work in the task worktree

All file reads and writes happen inside `$PROJECT_ROOT/.worktrees/$TASK_SLUG/`, not in the main repo.

```bash
cd "$PROJECT_ROOT/.worktrees/$TASK_SLUG"

# Now implement the task
# Edit files, run type checks, etc.

# Type check (per-file — faster than full monorepo check)
pnpm -F @agentvibe/web exec tsc --noEmit apps/web/src/app/api/scan/route.ts

# Lint
pnpm -F @agentvibe/web lint --max-warnings 0
```

## Step 5: Atomic conventional commits

One logical change per commit. Follow Conventional Commits format.

```bash
git add apps/web/src/app/api/scan/start/route.ts
git commit -m "feat(api): add rate-limit middleware to free scan endpoint (BMX-101)"
```

Scopes: `api`, `ui`, `db`, `auth`, `billing`, `agent`, `infra`, `test`

Multi-file changes: one commit if the changes are logically inseparable. Split if independently revertable.

## Step 6: Run diagnostics before return

```bash
# TypeScript diagnostics on ALL edited files
# (mcp__ide__getDiagnostics if available, otherwise tsc per file)

# Run relevant tests
pnpm -F @agentvibe/web test -- --testPathPattern="scan"

# If tests don't exist for the changed area, flag in return JSON
```

## Step 7: Return JSON and signal completion

Do NOT clean up the worktree yourself. CTO/QA-Lead needs to inspect it. Return:

```json
{
  "status": "COMPLETE",
  "agent": "backend-engineer",
  "branch": "feat/scan-rate-limit",
  "worktree": "/Users/adamks/VibeCoding/Agentvibe/.worktrees/scan-rate-limit",
  "files_changed": [
    "apps/web/src/app/api/scan/start/route.ts",
    "apps/web/src/lib/rate-limit.ts"
  ],
  "commits": ["feat(api): add rate-limit middleware (BMX-101)"],
  "summary": "Added per-IP rate limiting to /api/scan/start. Free tier capped at 3 scans per 24h via Redis-backed middleware.",
  "decisions_made": [],
  "blockers": [],
  "needs_followup": []
}
```

## Cleanup (after QA-Lead PASS and merge)

CTO or devops-engineer cleans the worktree after the PR is merged:

```bash
git worktree remove "$PROJECT_ROOT/.worktrees/$TASK_SLUG"
git branch -d "feat/$TASK_SLUG"
```

## .worktrees/ gitignore

Confirm this line is in `$PROJECT_ROOT/.gitignore`:

```
.worktrees/
```

If it is missing, add it before creating any worktree. Worktrees should never be committed.

## Parallel workers (CTO dispatch)

When CTO spawns multiple workers in parallel (Task calls), each gets its own worktree:

```
.worktrees/scan-rate-limit/    ← backend-engineer
.worktrees/scan-rate-limit-test/  ← test-engineer
```

Workers never share a worktree. If two workers need to see each other's output, CTO mediates — passes the prior worker's return JSON as input to the next worker's brief.

## Auto-fix rules (worker deviation rules)

Workers handle these without returning BLOCKED:
1. **TypeScript type errors** in files they authored — fix immediately
2. **Missing imports** — auto-add
3. **Unused imports** — auto-remove

Everything else (architectural mismatch, missing spec clarity, scope expansion) → return `PARTIAL` with `needs_followup`. CTO decides.

## See also

- `using-git-worktrees` — [[using-git-worktrees]]
- `qa-gate-protocol` — [[qa-gate-protocol]]
- `finishing-a-development-branch` — [[finishing-a-development-branch]]

## Anti-patterns

- Anchoring a child worktree at the main repo (`$MAIN_REPO/.worktrees/<slug>`) — it is above your session
  project root, so your own `Write`/`Edit` are refused there. Running the command *from* inside a worktree
  is fine; anchoring it outside your toplevel is not
- Committing to `main` or another worker's branch
- Using `git add -A` without reviewing the diff (can accidentally stage unrelated changes)
- Cleaning the worktree before QA-Lead has reviewed it
- Not returning `worktree` path in JSON (QA-Lead cannot inspect without it)
- Multiple workers sharing one worktree (state interference)
- Task slug not matching Linear ticket slug (makes correlation hard)
