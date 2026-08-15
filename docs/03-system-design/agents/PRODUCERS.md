# Producers — `builder` and `designer`

*The implementable specification for the two engines that write to the filesystem. Downstream of
[ROSTER-SIZE.md](../ROSTER-SIZE.md), which is binding: the roster is seven, the container test's
clause (b) is struck, `framer` is cut and its framing artifacts become builder's, and designer's
browser condition is discharged **YES**. None of that is relitigated here.*

**Date:** 2026-08-14 · **Status:** specification, not yet built · **Tier of this file:** `lite`
(`docs/03-system-design/**` at [qa-tier-floor.yml:172](../../../.claude/qa-tier-floor.yml), strictest
match wins over the `docs/**` trivial rule).

Every load-bearing claim below is a `file:line` in this repository, a command run while writing it on
2026-08-14, or an external source with an access date. Where something is unknown, it is labelled and
a probe is named. The two agents are specified across seventeen dimensions each; the dimension the
founder called central — isolation — is answered **once**, in §2, because it has one mechanism and
two descriptions of one mechanism disagree silently.

**§10 records every convention taken from another agent project, every one rejected, and the three
places where the field and this runtime's measurements disagree.** Roughly a dozen decisions in §2,
§3 and §6 changed after that research; each carries its source inline where it lands.

---

## 1. What binds, and what only looks like it does

Everything in §3 and §4 maps to something in this table. A boundary that maps to nothing is written
here as unenforced, in those words.

### 1.1 The enforcement primitives

| | Primitive | What it actually does | Where |
|---|---|---|---|
| **E1** | `tools:` frontmatter | **Subtracts**, and the subtraction binds behaviourally: `sourcer` (no `Bash`) made 0 Bash calls in 284 tool calls; `reviewer` (no `Write`/`Edit`) made 0 of each across 4,373. **Adds nothing** — there is no additive `allowedTools` in the binary (`strings -a 2.1.232 \| grep -c 'allowedTools?:'` → **0**, re-run 2026-08-14) | [AGENT-ARCHITECTURE.md:50-51](../AGENT-ARCHITECTURE.md) |
| **E2** | `.claude/hooks/pre-tool-use.sh` | The only mechanism in this repo that can refuse a call (`exit 2`). Sees exactly three fields: `tool_name`, `tool_input.command`, `tool_input.file_path` — **no agent identity** | `pre-tool-use.sh:67-90` |
| **E3** | `.claude/hooks/schema-lint.js` | Blocks CI on the *shape* of a declaration | `package.json` → `lint:agents` |
| **E4** | Branch protection + `qa-lead-pass.yml` | Blocks at the git edge, post-hoc | `.github/workflows/` |
| **E5** | `isolation: worktree` | Real git. 22 dispatches carried it; 62 meta records carry `worktreePath` | AGENT-ARCHITECTURE.md:56 |
| **E6** | Caller-side verification | The orchestrator checking a return against the branch. **Half-built:** `coding.js:63` detects dropout; nothing checks the diff | `coding.js:63-67` |
| **E7** | OS sandbox | Available in CLI 2.1.232. `grep -c '"sandbox"'` → **0** in both `.claude/settings.json` and `~/.claude/settings.json`. Configured nowhere | — |
| **E8** | `disallowedTools` / `bashCommandClamp` | Real in the binary (57 and 22 occurrences, counted 2026-08-14). **Used zero times in this repo.** Available only on the workflow surface | `.claude/workflows/*.js` |

### 1.2 The three asymmetries every choice below turns on

**Grants are file-only; denials are per-call.** A denial you forget to write fails open. A grant you
did not make fails closed. This is why `builder`'s container is the *named absence of every grant*
and why adding one MCP server to it destroys the only thing it is.

**The two dispatch surfaces are not equivalent.** The `Agent` tool's complete measured parameter
surface across 1,133 calls is `description · prompt · subagent_type · name · model · isolation`
(AGENT-ARCHITECTURE.md:90), and the tool schema in this session confirms it — no `effort`, no
`schema`, no `disallowedTools`. The workflow surface has all of them: `agent(prompt, opts?: {label,
phase, schema, model, effort, isolation, …})`, extracted from the installed binary 2026-08-14.
**Consequence, and it is a hard requirement, not a preference: every builder and designer dispatch
goes through `.claude/workflows/*.js`. The `Agent` tool is the degraded path** — on it there is no
enforced return schema, so "return what landed" degrades to "say what landed."

**There is no wall-clock bound anywhere.** `strings -a 2.1.232 | grep -c 'timeout?:'` → **0**. No
dispatch option ends a run on time. §3.8 is designed around that absence.

### 1.3 What is unenforced today, stated once so §3 and §4 can point here

- **`Bash` is unbounded.** Any agent holding it writes anywhere on the filesystem:
  `Write ~/.claude/settings.json` → exit 2 BLOCKED, but `echo "{}" > ~/.claude/settings.json` via
  Bash → **exit 0 ALLOWED** (AGENT-ARCHITECTURE.md:122-124). The project-root containment walk lives
  inside the `Edit|Write|NotebookEdit` arm (`pre-tool-use.sh:237`); the `Bash` arm (`:115`) has no
  path rule at all. Only E7 closes this.
- **Every `mcp__*` call is invisible to the hook.** The `PreToolUse` matcher in
  `.claude/settings.json` is `Bash|Edit|Write|NotebookEdit`, so the hook is not invoked; even if it
  were, `pre-tool-use.sh:342` is `*) # Unknown tool — allow`. Widening the matcher does not help —
  there is no `mcp__` arm and no URL field to match on.
- **The launcher turns permissions off.** `bin/warroom:235,237` launch every pane with
  `--dangerously-skip-permissions`.
- **Scope-within-the-repo is unenforceable in-session.** E2 has no agent identity, so "builder may
  not touch `.claude/agents/**`" cannot be a hook rule. It is E4 at the merge edge plus E6 at the
  return, and nothing during the run.

---

## 2. Isolation — the founder's actual question, answered once

> **Does each agent get a different worktree, and what happens when several run at once?**

**Yes. One worktree per *dispatch*, not one per agent** — the unit of isolation is the slice, and the
slice already has an identity: the `id` field of the `{id, agentType, brief, files}` job object that
`coding.js:22` refuses to run without. Two builders running concurrently get two worktrees; the same
builder dispatched twice gets two worktrees. Neither agent has a home directory it returns to.

### 2.1 Declare it in frontmatter **and** pass it at dispatch

`isolation: worktree` is in `REQUIRED_FRONTMATTER` (`schema-lint.js:73`) and both files carry it
today (`builder.md:9`, `designer.md:9`). But the measured evidence that it binds is about the
*dispatch option*: "22 calls carried it; 62 meta records carry `worktreePath`"
(AGENT-ARCHITECTURE.md:56). **Nothing in the corpus shows the frontmatter field alone creating a
worktree**, and CLAUDE.md's own rule 7 concedes `schema-lint.js` only *warns* about it. So both
files declare it — a declaration that fails closed costs nothing — and `coding.js:56` /
`design.js` pass `isolation: 'worktree'` at every producing dispatch, which is the half with
evidence.

> **Probe P1 (one afternoon, settles it):** dispatch `builder` twice — once via the `Agent` tool with
> no `isolation` argument, once with it — and compare `git worktree list --porcelain` before and
> after. If frontmatter alone creates the worktree, the dispatch option is redundant and can be
> dropped from the workflows. Until that runs, both are passed.

**Creation order, inherited from the field with one local exception.** obra/superpowers'
`using-git-worktrees` skill (accessed 2026-08-14) gives an order this spec adopts wholesale, because
it is field-tested and we would otherwise re-derive it badly:

1. **Detect existing isolation first**, and do it properly. Superpowers uses
   `GIT_DIR=$(cd "$(git rev-parse --git-dir)" && pwd -P)` versus
   `GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)`, with
   `git rev-parse --show-superproject-working-tree` to rule out a submodule. **Ours is weaker:**
   `builder.md:66` uses `git worktree list | head -1`, which answers "what is the main repo" and
   never answers "am I already inside a worktree." This matters immediately — the orchestrator
   dispatching these producers is itself inside `.worktrees/ceo-2-1786445435` right now.
2. **Assert the location is gitignored before creating** — but **not with their command verbatim.**
   Superpowers uses `git check-ignore -q .worktrees`. Run here, that returns non-zero — *"not
   ignored"* — which is wrong: `.gitignore:16` is `.worktrees/`, a **directory-only** pattern, and
   `check-ignore` will not match it against a bare name when the directory does not yet exist in the
   current tree. Verified 2026-08-14: `git check-ignore -v .worktrees/` prints
   `.gitignore:16:.worktrees/` and exits 0, while the same command without the trailing slash exits
   1. **Adopt `git check-ignore -q "$LOCATION/"`, with the slash.** A precondition that fails
   spuriously on a correctly-configured repo trains everyone to skip it, which is worse than not
   having one.
3. **Prefer a native worktree tool over manual `git worktree add`.** Superpowers names
   `EnterWorktree` / `WorktreeCreate` explicitly and falls back to git only when none exists.

> **The exception, and it is concrete.** This runtime *has* the native tools — `EnterWorktree` and
> `ExitWorktree` are live in CLI 2.1.232 — and `EnterWorktree` creates worktrees under
> **`.claude/worktrees/`**, not `.worktrees/`. That collides with three things here: `.gitignore`
> lists `.worktrees/` and would **not** match `.claude/worktrees/` (the pattern matches a directory
> *named* `.worktrees`); `collectors/worktrees.ts` and `.worktrees/.registry` look only at the
> project's own `.worktrees/`; and `.claude/**` is the most tier-gated tree in the repo. So adopting
> the native tool requires adding `.claude/worktrees/` to `.gitignore` and teaching the collector
> about it — otherwise every producer worktree lands untracked-but-not-ignored inside `.claude/`.
>
> **It is worth doing, for one reason that outweighs the migration:** `ExitWorktree` **refuses to
> remove a worktree that has uncommitted files or unmerged commits** unless `discard_changes: true`
> is passed explicitly. That is §2.6's "never destroy the evidence of a failure" enforced by the
> runtime instead of by prose — and prose is the one thing in this runtime that binds nothing.
> `EnterWorktree` also exposes a `worktree.baseRef` setting (`fresh` = branch from
> `origin/<default-branch>`, `head` = branch from local HEAD), which is exactly the base-ref policy
> `coding.js` currently has no way to state.
>
> `EnterWorktree`'s own guidance is to use it only when the user or project instructions call for a
> worktree. CLAUDE.md rule 7 — *"Worktrees for code. Every code worker creates a worktree."* — is
> that instruction, so the precondition is met.

### 2.2 Branch and path naming — and why it is load-bearing, not cosmetic

```
branch:   <engine>/<campaign>-<slice-id>      e.g.  builder/mc-pricing-tier-api
worktree: $MAIN_REPO/.worktrees/<campaign>-<slice-id>
```

Today `builder.md:67` and `designer.md:64` both use `feat/[slug]` with an unspecified slug, which
means two concurrent slices from one campaign collide whenever the orchestrator picks similar names,
and nothing in the branch says which engine produced it or which slice it belongs to.

The engine prefix buys three things a comment cannot:

1. **Cleanup is a query.** `git branch --list 'builder/*'` and `'designer/*'` enumerate the producer
   branches. Without the prefix, abandoned producer work is indistinguishable from a human branch.
2. **Live attribution.** Mission Control cannot today say which agent owns a worktree —
   `.worktrees/.registry` "says nothing about branch, HEAD, or lock state, and it can go stale"
   (`mission-control/server/collectors/worktrees.ts:3-7`), and `FleetRow` carries a `worktreeCount`,
   not per-worktree identity (`collectors/fleet.ts:29-40`). Encoding engine and slice in the branch
   makes `git worktree list --porcelain` — which `worktrees.ts` already parses into
   `{path, head, branch, locked, prunable}` — the answer, with no new collector.
3. **The slice id is the key `coding.js:63` already uses** for positional dropout detection. Reusing
   it means one identity, not two that can disagree.

`.worktrees/` is gitignored (`.gitignore`), so the working copies never enter a diff.

### 2.3 Concurrency: how many, and what happens

The mechanism exists and has never run: `coding.js:50` is `parallel(SLICES.map(...))` with
`isolation: 'worktree'` per slice — and **builder has never fanned out** (0 dispatches as an
`agentType`; only 8 spawns in the whole corpus carry `spawnedWithWorktree`). Everything in this
subsection is therefore a design under uncertainty, and is marked as such.

**Recommended ceiling: 4 concurrent producing worktrees per orchestrator.** The reasoning, argued
only from admissible scarcity (rate-limit headroom, wall-clock, context — cost is inadmissible):

- Every concurrent worktree adds to the *integration surface* the gate reviews as one diff.
  `coding.js:92` explicitly asks qa.js to "review the integration surface between slices as well as
  each slice" — that surface grows as O(N²) in slices touching related files while the reviewer's
  context does not.
- Every worktree of `mission-control/` needs its own `bun install` (§2.6). Wall-clock and disk, N
  times.
- N producers on Opus at `high`/`xhigh` simultaneously is the fleet's single largest draw on the
  rolling 5h window, which `FleetView` already displays (`collectors/fleet.ts:14`, `windowUsage`).

Four is a judgment, not a measurement. **Probe P2:** run one campaign at N=2, 4 and 8, and record
(i) rate-limit window consumption, (ii) wall-clock to gate verdict, (iii) merge conflicts between
slice branches. Adjust from that.

### 2.4 Conflict handling — the pre-check that beats the post-mortem

A merge conflict between two producer branches is a **decomposition defect, not a build defect**: it
means two slices claimed the same file. And the job object already carries the field that detects it
before dispatch — `files`.

> **The overlap pre-check is a set intersection over `slices[*].files`, about five lines, and it
> belongs in `plan.js`.** If two slices' `files` arrays intersect, the decomposition is wrong and the
> orchestrator re-slices rather than dispatching and hoping.

That this is worth doing is already demonstrated by the repo: `collectors/conflicts.ts:4-8` computes
the *post-hoc* version of exactly this — files with uncommitted changes in more than one worktree —
and surfaces it in `ConflictsView`. Mission Control shows you the failure the pre-check prevents.

When conflict happens anyway (a slice legitimately discovers it must touch a neighbour's file):
the builder does **not** resolve it. It returns `out_of_scope_noticed` (§3.7) and stops. The
orchestrator either re-slices or serialises the two.

### 2.5 Merge and integration — and one warning that must become a refusal

Producers never merge. `builder.md:121` already forbids it and E4 backs it at the git edge.

Integration is the orchestrator's: create an integration branch from the same base, merge each slice
branch into it in slice-id order, pass that range as `args.ref` to the gate.

**`coding.js:79-87` names this defect precisely and then proceeds anyway.** The default
`REF = 'origin/main...HEAD'` reflects the *caller's* worktree, not the slice work, so with the
default in place the gate reviews an empty or wrong diff. Today that is a `log()` warning
(`coding.js:86`). **It must be a refusal**: a gate that reviews the wrong range and returns PASS is
worse than a gate that refuses, and this repo has catalogued that defect class nine times. One-line
change, and it is in §7 step 3.

### 2.6 Cleanup of abandoned worktrees

**The producer never removes its own worktree.** A builder that cleans up after a failure destroys
the evidence of the failure. Removal is the orchestrator's, after the slice is merged or explicitly
abandoned.

The field agrees on the substance and adds two mechanics we did not have. Superpowers'
`finishing-a-development-branch` (accessed 2026-08-14) does let its agent own cleanup — but only at
the *finishing* step, after integration, and under two rules worth copying verbatim:

- **Removal must run from outside the worktree.** The skill captures `$WORKTREE_PATH` in an early
  step, *before* changing directory to the main repo root in a later one, then runs
  `git worktree remove "$WORKTREE_PATH"` and `git worktree prune` from there. This is not fussiness:
  superpowers issue #583 (accessed 2026-08-14, **closed as not planned**) reports as a live field
  failure that *"worktree removal fails when the agent's working directory is inside the worktree
  being deleted."*
- **A refusal on uncommitted files is a question, not an obstacle.** The skill *"shows what files
  exist and asks the human partner how to proceed — never forcing deletion on its own initiative,"*
  and for worktrees outside its own provenance it must *"leave it in place."* `ExitWorktree`
  enforces the same rule mechanically (§2.1).

Also from that skill, and adopted: **integration is the human's decision, not the agent's.** It
presents three options — merge to base locally, push and open a PR, keep the branch as-is — and
*"waits for their answer; the integration decision is theirs."* That is CLAUDE.md rule 8's
founder-confirmation, arrived at independently.

Issue #583 is worth reading in full before anyone expands worktree use here, because its other three
reported frictions are ours too: the controller running scripts from main rather than the worktree;
agents skipping worktree creation during debugging; and `git checkout main` failing inside a worktree
because main is already checked out in the parent. **The maintainers declined to make isolation
optional and the reporter forked instead** — so the field has *not* resolved this, it has chosen a
side. We are choosing the same side, with the frictions now named.

The helper that should exist and does not — `scripts/worktree-sweep.mjs`:

- Enumerate via `git worktree list --porcelain`; the parser is already written and tested at
  `collectors/worktrees.ts:36` (`parseWorktreePorcelain`), including `locked` and `prunable`.
- Flag: `prunable`; branch matching `<engine>/*` with no commits ahead of its merge-base; HEAD
  unmoved for more than N hours; **working tree dirty** (§3.13 mode 1).
- `--remove` acts only on the confirmed set. Never `git clean` — `pre-tool-use.sh:143` blocks it, and
  correctly: it would take `.worktrees/.registry` and `.claude/memory/sessions/` with it.

This is a script, not an agent, and it is the strongest instance of "prefer a script" in this spec.

**Nothing in the field covers this case, and that is worth stating.** Superpowers' cleanup runs on
the *happy path* — work finished, human chose an integration option. `using-git-worktrees` says
nothing about removal at all. Neither addresses the worktree whose agent dropped out and will never
reach a finishing step, which at N-wide fan-out is the common case rather than the exotic one. The
sweep is ours to write.

### 2.7 What designer needs that builder does not

Three things, all real, none of them a second container:

1. **A port, derived from the slice id.** `mission-control/package.json` runs `vite`, which
   *auto-increments* on a busy port — so two designers rendering at once will silently capture each
   other's app. The brief carries an explicit port; the capture asserts the served build's git SHA
   matches its own HEAD before it believes a pixel.
2. **Installed dependencies.** `node_modules/` is gitignored, so every fresh worktree of
   `mission-control/` has none. `mission-control/check.mjs` already detects this and prints
   `mission-control: dependencies missing — run bun install in mission-control/` (`check.mjs:36`).
   Builder hits this only when it runs `check:mc`; designer hits it on **every** dispatch, because it
   cannot render without it.
3. **A place to put binary captures.** PNGs are derived artifacts and must not enter the feature
   branch. They go to a gitignored path inside the worktree, and the return carries the path plus the
   **git SHA** captured against — never an mtime (ROSTER-SIZE §4.3).

### 2.8 Sandbox

**Neither agent has one today, and neither should be described as having one.** E7 exists in CLI
2.1.232 and is configured nowhere. What both actually have is E5 — a git worktree, which bounds
*what a reviewer must read*, not *what a process may write*. Stating it any other way is the
decorative-capability failure this repo names as its own worst pattern.

---

## 3. `builder`

> Produce a repo artifact in isolation and return exactly what landed. Code, schema, migration
> authoring, tests, docs, copy — and, since `framer` is cut, the **framing artifacts**: specs,
> positions, decision records.

### 3.1 Model and effort

| | |
|---|---|
| **Model** | `claude-opus-5` — **founder instruction**, and it overrides ROSTER-SIZE §4.2's `claude-sonnet-5`. |
| **Effort** | `high` in frontmatter; per-dispatch escalation to `xhigh` on the workflow surface. |

Two things must be said plainly rather than swallowed.

**The founder's Opus instruction is honoured and it has a named cost.** Builder is the fan-out
container: at the §2.3 ceiling that is four Opus contexts at once, which is the fleet's largest draw
on the rolling 5h window — the *first* admissible scarcity. That is the tradeoff, it is the founder's
to make, and it is made. `effort: high` rather than `xhigh` is where the headroom is recovered,
because a slice arrives with its decisions already made — the brief names the outcome, the `files`
and the tier — and depth buys less on a bounded task than it does on designer's open-ended one.

**`effort` is per-dispatch on one surface only.** It appears in **0 of 1,133** `Agent` calls, and the
`Agent` tool schema in this session has no `effort` parameter at all — so on that path it is
file-only. On the workflow path it is real: `agent(prompt, opts?: {label, phase, schema, model,
effort, isolation, …})`, extracted from binary 2.1.232 on 2026-08-14, and 95 turns at `effort: max`
exist on this machine. **Answering the dimension directly: per-dispatch effort is available, but only
through `.claude/workflows/*.js`.** This is the second reason §1.2 makes the workflow surface
mandatory.

**Blocking prerequisite:** `schema-lint.js:97` still pins `VALID_MODELS = ['claude-opus-4-7',
'claude-sonnet-4-6', 'claude-haiku-4-5']`. Declaring `claude-opus-5` fails CI until that line moves.
§7 step 0.

### 3.2 Permissions — granted, denied, and what enforces each

```yaml
tools: [Read, Write, Edit, Bash, Glob, Grep]
# no mcpServers, ever
```

| Boundary | Enforced by | Real? |
|---|---|---|
| No MCP server of any kind | **E1** (grants are file-only; an absent grant fails closed) | **Yes** — the strongest boundary builder has |
| No `Agent` — may not spawn | **E1**. Subtraction binds behaviourally: 0 Bash across 284 `sourcer` calls, 0 Write across 4,373 `reviewer` calls | **Yes** |
| No write outside the project root | **E2** `pre-tool-use.sh:302`, device+inode containment, fails closed | **Yes, for `Write`/`Edit` only** |
| No `.env` read or write | **E2** `:162` (read via any allowlisted tool) and `:308` (write) | **Yes** |
| No editing an existing migration | **E2** `:317-321` — exists-check, so *authoring a new one is allowed* | **Yes** |
| No `--no-verify`, no force-push to main, no `git reset --hard`, no `git clean -fdx` | **E2** `:143-153`, `:200-222` | **Yes** |
| No writes outside the slice's `files` | **E6** at the return + **E4** at merge | **No, in-session.** E2 has no agent identity |
| No touching `.claude/agents/**`, `.claude/hooks/**`, `.github/workflows/**` | **E4** + `qa-tier-floor.yml:64-88` (`irreversible`, `enforcement: block`) | **No, in-session** |
| Nothing constrains `Bash` | — | **Unenforced.** §1.3. Only E7 |

### 3.3 Isolation

Per §2, with no delta. Own worktree per dispatch, branch `builder/<campaign>-<slice-id>`, no sandbox,
never removes its own worktree, never merges.

### 3.4 Skills — three, and two current ones deleted

```yaml
skills:
  - verification-before-completion
  - systematic-debugging
  - worktree-isolation-pattern
```

`skills:` is file-only, is injected as `isMeta` user messages *before turn 1* (288 of 431
transcripts), and `check-registration.mjs` check #4 fails the build if a declared skill is missing
from `MANIFEST.json`. All three verified present on disk 2026-08-14.

- **`verification-before-completion`** — *"before committing or creating PRs, requires running
  verification commands and confirming output before making any success claims."* Builder's single
  largest failure mode is returning COMPLETE on an unverified claim. This is the procedure against
  it, and it is the same discipline the `verification` field in §3.7 makes structural.
- **`systematic-debugging`** — Step "verify by running" fails, and the deviation rule caps at three
  attempts. Without a method, three attempts is three guesses.
- **`worktree-isolation-pattern`** — Agentvibe-authored, and its own description is *"the exact git
  worktree create, detect, and clean pattern for Agentvibe workers … branch naming conventions,
  atomic commits, and `.worktrees/` gitignore enforcement."* It is Step 1 of every single dispatch.

**Delete `api-design-principles` and `error-handling-patterns` from `builder.md:11-12`.** Both are
*backend* skills attached to a container that covers backend, frontend, database, AI, devops, data,
tests, docs and copy. Injecting REST/GraphQL design procedure before a copywriting or migration
dispatch is a per-domain skill wearing a universal one's clothes, and it costs the pre-turn-1 budget
on every dispatch that is not backend.

**The real constraint this exposes, and the fix.** There is no per-dispatch skill selection: no
`skills` option on `agent()` and none on `Agent`. So one builder file carries one skill set for eight
domains, and 92% of the 134-skill library is unreachable through the one channel measured to work.
Pointing at a skill in the brief is the *weak* channel — `design.js:80` does exactly that
(*"MANDATORY: before designing, Read … SKILL.md"*), which is a pointer an agent may ignore in place
of an injection it cannot refuse.

> **The fix is that the orchestrator pastes the domain skill's body into the brief.** It holds
> `Read`; a `SKILL.md` body is text; the prompt is a channel that binds. This converts a pointer into
> a payload at a cost of ~500-2,000 orchestrator tokens per skill. It is a real mechanism rather than
> a hope, and it does not need a new container — which is the whole point of §5 of ROSTER-SIZE.

### 3.5 MCP servers

**None. Ever.** Builder's container *is* the named absence of every grant (ROSTER-SIZE §4.2); one MCP
server and it stops being that, permanently, because the `Agent` path offers no `disallowedTools` to
take it back.

Mechanically this is also currently impossible to declare: `mcpConfigured()`
(`schema-lint.js:85-93`) returns false unless `.mcp.json` exists or `settings.json` has an
`mcpServers` key — verified 2026-08-14, neither does — so `schema-lint.js:299` **fails the build**
for any `mcpServers:` declaration, and `check-registration.mjs` check #6 warns on the same.

### 3.6 Prompt strategy — and what makes it non-sycophantic *mechanically*

Three channels, three jobs, and the file is the one that must stay stable for prompt caching:

| Channel | Carries | Binding |
|---|---|---|
| **The agent file** (`agentType` selects it; the binary's own error string is `agent({agentType}): agent type '…'`) | Identity, boundary, procedure, return contract, anti-patterns | Stable across dispatches — caching depends on it |
| **`skills:`** | Universal procedure, injected pre-turn-1 | File-only |
| **The brief** (dispatch-time) | `{id, agentType, brief, files}`, the lens text, the base commit, any pasted domain-skill body | Per-dispatch |

**Nothing in the wording makes it non-sycophantic.** `builder.md:120` already says *"DO NOT claim
verification you did not run"* and it is enforced by nothing: frontmatter `return_contract:` is
decorative — `schema-lint.js:353` checks the key exists, and `grep -rn return_contract scripts/
.claude/workflows/` → **0**. Four mechanisms do the work instead:

1. **A runtime-enforced `schema` at the dispatch site** with `additionalProperties: false`. There is
   no field for praise, and `verification` cannot be satisfied by an adjective.
2. **E6, caller-side:** `git diff --name-only $base..$head` compared against `files_changed`. A claim
   that does not match the branch is a failed return, not a success.
3. **The producer cannot close.** `reviewer` is a different container holding no `Write` — 0 writes
   across 269 runs — and CI hard-fails a `reviewer` that declares one (`schema-lint.js:62`,
   `READ_ONLY_ENGINES`).
4. **The claim ledger executes claims.** `claim(kind=behavior, verified_by=command)` is run by
   `scripts/lib/resolvers.js`, not read.

### 3.7 Return contract — the real one

The binding contract is the dispatch-site `schema`. Frontmatter `return_contract:` stays only because
`schema-lint.js` requires the key, and the file says so in those words.

This **extends** `coding.js:25-38`'s `SLICE_SCHEMA` rather than introducing a rival:

```js
const BUILDER_RETURN = {
  type: 'object', additionalProperties: false,
  required: ['status','slice_id','branch','worktree','base','head','files_changed','verification','summary'],
  properties: {
    status:      { type: 'string', enum: ['COMPLETE','PARTIAL','NEEDS_CONTEXT','BLOCKED'] },
    slice_id:    { type: 'string' },
    branch:      { type: 'string' },
    worktree:    { type: 'string' },
    base:        { type: 'string' },   // commit branched FROM
    head:        { type: 'string' },   // commit left BEHIND
    files_changed: { type: 'array', items: { type: 'string' } },
    commits:     { type: 'array', items: { type: 'object', properties: {
                     sha: {type:'string'}, subject: {type:'string'} } } },
    verification:{ type: 'array', items: { type: 'object',              // ARRAY, not object
                   required: ['cmd','exit'], properties: {
                     cmd: {type:'string'}, exit: {type:'number'}, stdout_tail: {type:'string'} } } },
    claims_emitted:      { type: 'array', items: { type: 'string' } },
    deviations:          { type: 'array', items: { type: 'object', properties: {
                             rule: {type:'string'}, file: {type:'string'}, what: {type:'string'} } } },
    out_of_scope_noticed:{ type: 'array', items: { type: 'object', properties: {
                             file: {type:'string'}, why: {type:'string'} } } },
    blockers:            { type: 'array', items: { type: 'object', properties: {
                             decision: {type:'string'}, options: {type:'array', items:{type:'string'}},
                             why_blocked: {type:'string'} } } },
    summary:     { type: 'string' },
  },
}
```

Five changes from `builder.md:104-113`, each earning its place:

- **`base` and `head`.** Today's contract returns neither, so "what landed" cannot be checked without
  guessing the base commit. With both, the caller's verification is a pure command and E6 becomes
  four lines instead of a judgment. **Field-confirmed:** superpowers' `subagent-driven-development`
  (accessed 2026-08-14) builds its review package as `review-package PLAN_FILE BASE HEAD` where
  *"BASE is the commit recorded before dispatch, never `HEAD~1`"* — the same field, for the same
  reason, discovered independently.
- **`NEEDS_CONTEXT` as a status distinct from `BLOCKED`.** Taken directly from superpowers, whose
  implementer returns one of `DONE · DONE_WITH_CONCERNS · NEEDS_CONTEXT · BLOCKED`. The distinction
  is real and my first draft collapsed it: *"the brief is ambiguous, answer me and I continue"* is a
  cheap round-trip to the orchestrator, while *"I cannot proceed"* frees the worktree and may need a
  human. Collapsing them makes every ambiguity look like a failure and pushes the orchestrator to
  re-dispatch work that only needed a sentence. Their `DONE_WITH_CONCERNS` is **not** adopted —
  `PARTIAL` plus a populated `blockers` array already expresses it, and a fifth status buys a
  synonym.
- **`verification` is an array.** One object holds one fact; "the build passed" and "the tests
  failed" are two, and a single object hides exactly the case that matters. Each entry is
  `{cmd, exit, stdout_tail}` — an exit code, not an assurance.
- **`deviations`.** Which auto-fixes it took under Rules 1-5 (§3.9). Without this the reviewer cannot
  tell an in-scope type fix from scope creep.
- **`out_of_scope_noticed`.** `builder.md:117` already says *"note and return"* — with no field to
  note it in. Now there is one, and §2.4 consumes it.

### 3.8 Stop and exhaustion — designed against an unknown

**`maxTurns` does not bind.** A file elsewhere on this machine declaring `maxTurns: 12` produced runs
of 47, 36, 36, **633**, 42, 37 and 46 turns (AGENT-ARCHITECTURE.md:29-37); `reviewer.md:7` declares 20
and 196 of 269 runs exceeded it. **Delete the field from both producer files**, and from
`REQUIRED_FRONTMATTER` (`schema-lint.js:71`), the range check (`:285`) and the advisory (`:405`). A
number nothing reads that this repo has been reasoning about as a safety property is worse than no
number.

**Nobody knows what stops a run.** Stop reasons are unrecorded, and `strings -a 2.1.232 | grep -c
'timeout?:'` → **0**: no dispatch surface offers a wall clock. So the design is against the absence:

| Observed stop | Detected by | Response |
|---|---|---|
| Null return (dropout) | `parallel()` returns positional nulls; `coding.js:63` compares against `SLICES` by index | **Already correct:** `BLOCKED, reason: 'slice agent dropout — refusing to QA a partial diff'` (`coding.js:66`). A dropout is never a skip |
| Schema-invalid return | The runtime rejects it | Treat identically to dropout |
| **COMPLETE with a dirty worktree** | **Nobody, today** | `git -C <worktree> status --porcelain` non-empty ⇒ the return is a claim about work the diff range does not contain. Demote to PARTIAL and re-dispatch with the dirty file list. §3.16 helper 3 |
| Three failed attempts on one failure | The agent itself | `PARTIAL` with what works, per the `evidence` lens: *"Stop after three failed attempts and report partial progress rather than looping"* (`lenses.yml:157`) |

**Failure policy differs by parallelism, and that refinement is Spec Kit's.** `implement.md` *"halts
if non-parallel tasks fail; reports parallel failures without stopping."* The logic transfers exactly
to slices: a failure in a slice nothing depends on should not abort the other three, while a failure
in a sequential prerequisite must. Our flat rule — three attempts, then PARTIAL — is right *within* a
slice and says nothing *across* slices, and `coding.js:63-76` currently treats any BLOCKED slice as a
reason to skip the gate entirely for all of them. Spec Kit's split is the better default and belongs
in `plan.js`, which is where the dependency edges are known.

**How it fails loudly:** a dropout returns `BLOCKED` from the workflow, which means the gate never
runs, which means nothing merges. That is the correct loudness for an automated path. It is *not*
loud to a human — see §3.12's escalation gap.

> **Probe P3, and it is cheap:** the records exist. `~/.claude/projects/**/agent-*.meta.json` joined
> to its sibling `.jsonl` is the same join AGENT-ARCHITECTURE §0 used for turn counts. Read the
> terminal record of all 2,383 subagent runs and histogram the stop condition. One script, one
> afternoon. **Until it runs, every exhaustion policy in this document is a guess, including this
> one.**

### 3.9 Autonomy and escalation — where the dial is

**The dial is the risk tier, and the tier is computed from the `files` array before dispatch.**
`scripts/classify.mjs` exists, `scripts/lib/classifier.js` is the single implementation, and it has
**zero in-run call sites** today. Wiring it is the autonomy dial; no other knob is needed.

| Tier (from `files`) | Builder's autonomy |
|---|---|
| `trivial` / `lite` | Decides alone inside scope. Rules 1-5 auto-apply. Reviewer judges the result |
| `full` | Same, and the brief must carry the base commit so review runs from a recorded baseline |
| `irreversible` | **May author, may not apply.** Writes the new migration `.sql`; nothing applies it — that is `operator`. Returns BLOCKED on `.claude/agents/**`, `.claude/hooks/**`, `.github/workflows/**` and `scripts/lib/**` unless the brief carries explicit founder authorisation, because those are `enforcement: block` harness self-edit at `qa-tier-floor.yml:64-93` |

**Auto-fix without asking (Deviation Rules).** 1-3 are already in `builder.md:91` and are kept:

1. Type errors in files it is already changing.
2. Imports it introduced that are missing.
3. Lint failures and obvious typos inside its own diff.

Two more, added because they come up constantly and are ambiguous today:

4. **Installing an already-declared dependency** — `bun install` in `mission-control/`. This restores
   a declared state; it does not choose one. Adding a *new* dependency to `package.json` is a choice
   and is BLOCKED.
5. **Creating a directory its own new file requires.**

**Forces BLOCKED — return the decision, never invent it:**

- Any architectural decision the brief did not make (existing rule).
- A new dependency, a new external service, or a new environment-variable name.
- A file outside `files` needs changing → `out_of_scope_noticed`, and stop. Do not touch it.
- **A test it did not write fails — *and was passing at the baseline*.** Either it is a real
  regression (a finding, which belongs to the reviewer) or the fix is to move the goalposts. Editing
  another author's expectation to make your code pass is the one failure BMAD enforces against with a
  sentence and this repo can enforce with a status value.

**The baseline is a step, not an assumption — and this is a rule the field has and we did not.**
Superpowers' `using-git-worktrees` Step 3 is *"verify clean baseline"*: run the tests **before
changing anything** and report the count and status. Without that, a producer cannot tell its own
breakage from breakage it inherited, so *every* pre-existing red test becomes either a false BLOCKED
or a silent temptation to "fix" someone else's expectation. Concretely here: **run
`node mission-control/check.mjs` (or the relevant root `check:*` step) immediately after
`bun install` and before the first edit, and record the result as `verification[0]`.** That single
entry is what makes the qualifier above — *and was passing at the baseline* — a checkable fact rather
than a memory.

Its Step 2 is the same shape as Deviation Rule 4, arrived at independently: auto-detect and install
dependencies (`if [ -f package.json ]; then npm install; fi`, and the Cargo/pip/poetry/go
equivalents). Ours is `bun install` in `mission-control/`, and the detector already exists at
`check.mjs:36`.

Escalation target: `orchestrator`, for both files, as today. Builder never reaches the founder — it
has no channel, and neither does anything else: `grep -rn 'gh issue create|osascript|
terminal-notifier|slack|sendmail'` across `bin/`, `scripts/`, `.claude/hooks/`, `.github/` and
`mission-control/server` returns **zero** (ROSTER-SIZE §6). `InboxView` exists to display exactly
these escalations and its own header records that *"nothing in this repository has ever written into
`~/.<project>/messages/`"* (`InboxView.tsx:3-4`) — and a write there would be **refused by E2
anyway**, being outside the project root. **A builder that returns BLOCKED at 02:14 exits into
silence.** That bounds how autonomous either producer can safely be, and it is not fixed by anything
in this document.

### 3.10 Context on arrival

**Knows without reading:** its own file (system prompt), three injected skill bodies, and the brief.

**Must read:** the files named in `files`; the lens text (pasted into the brief, not pointed at).

**Must not read:** the skills `MANIFEST.json` (~15,000 tokens across 147 entries — CLAUDE.md); the
surrounding tree (`builder.md:57`: *"Reading the surrounding tree costs context and buys nothing"*);
the campaign goal or the other slices' briefs.

That last exclusion is deliberate and now has two kinds of evidence. Statistically: inter-agent
misalignment — failures that exist only because agents talk to each other — is **36.94%** of 1,600+
annotated traces (MAST, NeurIPS 2025 D&B, carried from ROSTER-SIZE §3), while disobeying a role
specification is the *rarest* mode at 0.5%. Operationally, and this is the sharper citation:
superpowers' `subagent-driven-development` (accessed 2026-08-14) states the rule outright — *"A
dispatch prompt describes one task, not the session's history. Do not paste accumulated prior-task
summaries ('state after Tasks 1-3') into later dispatches"* — and reports what happens when you do:
**a real session's dispatch reached 42,000 characters, of which 99% was pasted history.** That is
the failure mode our orchestrator will produce by default, from a project that ran into it first.

**The read manifest is declared and marked, not left to judgement.** GitHub Spec Kit's
`implement.md` template (accessed 2026-08-14) loads context as an explicit ordered list with
required/conditional markers — `tasks.md` REQUIRED, `plan.md` REQUIRED, then conditional
`data-model.md`, `contracts/`, `research.md`, `memory/constitution.md`, `quickstart.md`. Adopted,
because it converts "the agent should have read the spec" into a **detectable halt**: a missing
REQUIRED artifact stops the run instead of silently degrading into a plausible guess. Here the
required set is *the brief, the files in `files`, and the lens text*; everything else is conditional
and named in the brief.

Spec Kit also gates on unfinished prerequisites before it starts: it counts checkbox states under
`FEATURE_DIR/checklists/` and, if any are unchecked, *"STOP[s] and ask[s]"* — and *"if user says 'no'
or 'wait' or 'stop', halt execution."* The transferable half is the **artifact-existence
precondition**, which ROSTER-SIZE §5.2 already asks for; the human-prompt half is not, because a
producer here has no channel to a human (§3.9), so the equivalent is `NEEDS_CONTEXT` back to the
orchestrator.

**Budget:** brief ≤ 500 tokens (CLAUDE.md's handoff cap), plus the lens, plus the files. Glob and
Grep to locate; Read only what will change.

### 3.11 State and memory

**Writes:** source files inside its worktree, in atomic commits — one logical change each, never to
`main` or another engine's branch.

**Does not write:** session files (the orchestrator's, per CLAUDE.md's documentation gate);
`DECISIONS.md`; `CODEBASE-MAP.md` (generated by `scripts/gen-codebase-map.mjs`, and `check:map` fails
on a hand edit); anything outside the worktree.

**Survives:** the branch and its commits. Nothing else — deliberately. The branch is the only piece of
state whose existence a caller can verify with a command.

**The next agent inherits** `{branch, base, head, files_changed}` — enough to compute the diff — and
not the builder's reasoning.

**Claims.** A claim is emitted by writing a fenced ` ```claims ` block into a git-tracked file.
Builder holds `Write`, so unlike `sourcer` it *can* actually produce the exit criterion it is
dispatched to produce: `claim(kind=behavior, verified_by=command)` is the exit of `ship-feature.yml`'s
build stage, and builder can emit it. That is the one stage exit in this repo that is not broken by
its own engine's tool list.

**Across dispatches: no memory.** Each dispatch is fresh context. Deliberate.

### 3.12 Observability — mapped to Mission Control's real views

| The founder wants to see | View | Route | What it actually shows |
|---|---|---|---|
| How many producers are live, and headroom | **FleetView** | `/api/fleet` | `agentActive`, `worktreeCount`, `lastActivityAt`, and the account-wide rolling-5h budget (`collectors/fleet.ts:14`) |
| Whether a specific run has stalled | **SessionsView** | `/api/sessions` | Every indexed session; "live" is a stated predicate — last recorded turn inside `LIVE_WINDOW_MS`, with the rule printed on screen (`SessionsView.tsx:4-6`) |
| Two slices colliding | **ConflictsView** | `/api/conflicts` | Files with uncommitted changes in more than one worktree (`conflicts.ts:4-8`) — post-hoc; §2.4's pre-check is what prevents it |
| Abandoned worktrees | **ProjectView** | `/api/project/:id` | Per-worktree `branch`, `head`, `locked`, `prunable` |
| A pending escalation | **InboxView** | `/api/inbox` | Empty for every project, and honestly says so (`InboxView.tsx:3-4`) |

Two gaps, named rather than papered over:

- **Mission Control has no HTTP write routes, by design** (`routes/api.ts` is `get` only). The
  founder can watch a runaway builder and cannot stop it from that surface.
- **Live agent→worktree attribution does not exist** as a field. §2.2's branch convention is what
  supplies it, through a parser that already ships.

### 3.13 Failure modes and recovery

| # | Mode | Who notices | Recovery |
|---|---|---|---|
| 1 | **Worktree left dirty on COMPLETE** | **Nobody today** | `git -C <wt> status --porcelain` at the return; demote to PARTIAL, re-dispatch with the dirty list. `conflicts.ts` already runs this exact command per worktree for another purpose |
| 2 | **Branch abandoned** | `ProjectView` `prunable`; the §2.6 sweep | Orchestrator removes the worktree, keeps the branch N days. Producer never self-cleans |
| 3 | **Partial edit** (half a refactor) | `tsc` / `bun test` via `check:mc`; else the reviewer | `PARTIAL` is a legal status and `verification` is an array, so "build passed, tests failed" is expressible instead of hidden |
| 4 | **Dependency not installed** | `mission-control/check.mjs:38` → `DEPS_MISSING`, exit 1 | Deviation Rule 4: run `bun install`. Cost is N × install per campaign — real wall-clock and disk, mitigated only by bun's global cache |
| 5 | **Silent dropout** | `coding.js:63`, positional | Handled correctly already |
| 6 | **Hook bypass attempt** (`--no-verify`) | **E2** `pre-tool-use.sh:200` | Blocked. Fix the hook failure |
| 7 | **Builder edits `.claude/agents/**`** | **E4** + `qa-tier-floor.yml:70` `irreversible`/`block` | Caught at merge. **In-session: unenforced** |
| 8 | **Builder writes outside the project root via `Bash`** | **Nobody** | Exit 0 today (AGENT-ARCHITECTURE.md:124). Only E7 closes it |
| 9 | **Return claims files the branch does not contain** | E6, once built | `git diff --name-only $base..$head` vs `files_changed`; mismatch is a failed return |

### 3.14 Dispatch

- **Spawned by:** `orchestrator`, the sole holder of `Agent` in `tools:` (ROSTER-SIZE §4.1).
- **Depth:** orchestrator at 0-1, builder at 1-2. Nesting is not blocked —
  `spawnDepth {0: 585, 1: 1,744, 2: 49, 3: 5}` — so depth is argued on blast radius, not permission.
- **Builder may not spawn.** Enforced by **E1**: no `Agent` in `tools:`, and subtraction is the one
  denial with strong measured evidence. **The field states this as an explicit clause in the dispatch
  prompt and gives the reason we lacked:** superpowers carries a *"no-subagents contract"* — *"The
  implementer never dispatches subagents — not helpers, and never a reviewer"* — because *"in real
  sessions, every reviewer a worker spawned duplicated the task review the controller dispatched
  anyway — a full extra review seat per task."* Adopted as a sentence in the brief **in addition to**
  the tool denial, not instead of it: the denial is what binds, the sentence is what stops the agent
  wasting turns discovering it.
- **The brief is a generated file with a path, not pasted prose.** Superpowers generates it with
  `scripts/task-brief PLAN_FILE N` and introduces it as *"read this first — it is your requirements,
  with the exact values to use verbatim,"* then passes only the path plus a line of positioning and
  any cross-task interface decisions the brief could not know. Adopted: `plan.js` writes the brief
  to a path and the dispatch passes the path. It is deterministic, diffable, re-readable by the
  reviewer, and it is the structural defence against the 42k-character dispatch in §3.10.
- **Arguments:** `{id, agentType, brief, files}` — the job object. `coding.js:22` refuses to run
  without it and **nothing in this repo produces it.** `plan.js` does not exist;
  `research.js:100-111` already implements the identical twelve-line shape for sub-questions. This
  is the single largest blocker to this specification being executable.
- **Concurrency:** up to 4 (§2.3), via `parallel()` at `coding.js:50`.
- **Surface:** `.claude/workflows/coding.js`. The `Agent` tool is the degraded path and loses
  `schema`, `effort` and `agentType` (§1.2).

**Note, though it belongs to `reviewer`:** all four `agent()` sites in `qa.js` (`:122, :132, :179,
:199`) pass `{label, phase, model, schema}` with **no `agentType`**, so every dimension reviewer and
the judge currently run as default general-purpose agents holding `Write` and `Edit` on the diff they
judge. Builder's whole provenance story — producer cannot close — is bypassed at the only place it
binds. It is a four-word fix and it is a precondition for this spec meaning anything.

### 3.15 QA of the agent itself

| Drift | Caught by |
|---|---|
| Missing/invalid frontmatter, wrong model, wrong isolation, missing body section | `npm run lint:agents` → `schema-lint.js` (`REQUIRED_FRONTMATTER:66`, `VALID_MODELS:97`, `VALID_ISOLATION:98`, `MANDATORY_SECTIONS:102`) |
| A declared skill that does not exist | `npm run check:registration` check #4 |
| `mcpServers:` with no MCP config | `schema-lint.js:299` **fails**; `check-registration.mjs` #6 warns |
| A name colliding with a drifted `~/.claude/agents/` copy | `check-registration.mjs` #7 (warn) |
| Editing the file at all | `qa-tier-floor.yml:70` — `.claude/agents/**` is `irreversible` + `enforcement: block`: full review + 2-of-3 multi-judge + founder sign-off |

**What is *not* caught, and should be:**

- Nothing validates a return against `return_contract:` (grep → 0). The §3.7 dispatch `schema` is the
  only real check, and it lives in `coding.js`, not in the agent file.
- Nothing checks that the declared `model:` is the model that ran. `reviewer` ran `claude-sonnet-4-6`
  269 of 269 times inside sessions defaulting to `claude-opus-5[1m]`, by a stale pin nobody saw.
- **No behavioural test exists.** Nothing spawns `builder` and asserts it refuses an out-of-scope
  write. `scripts/probe-readonly.test.mjs` is the closest thing in the repo and its own header
  explains why this is hard: a self-reported record written by the same Bash-capable actor the probe
  tests is forgeable, so the design *"removes the PASS path entirely"* (`probe-readonly.test.mjs:26`).
  The same reasoning applies here — a builder behavioural test may only produce FAIL or UNRESOLVED,
  never PASS, until E7 exists.

### 3.16 Helpers — what should be a script instead of a model call

1. **Tier from paths** — `node scripts/classify.mjs <files...>`. Exists; zero in-run call sites. Wire it.
2. **Slice overlap pre-check** — set intersection over `slices[*].files`. ~5 lines in `plan.js` (§2.4).
3. **Dirty-worktree check** — `git status --porcelain` per returned worktree. ~3 lines caller-side.
4. **Landed-diff check (E6)** — `git diff --name-only $base..$head` vs `files_changed`. ~4 lines. This
   is the mechanism that turns "return what landed" from a sentence into a fact.
5. **Typecheck, lint, test** — `mission-control/check.mjs` already does probe → `tsc` → `bun test`,
   exiting on the first failure; `npm run check` at the root. Builder *runs* these; it does not reason
   about whether the code is correct.
6. **Worktree sweep** — `scripts/worktree-sweep.mjs`, does not exist (§2.6). Parser already written.

### 3.17 Migration

See §7 for the ordered plan. Builder's own file change is **`irreversible`** tier
(`qa-tier-floor.yml:70`).

---

## 4. `designer`

> Build a customer-facing surface and close the perception loop on it: render, look at the render,
> change, re-render. **That loop has never closed in this system.**

### 4.1 Model and effort

| | |
|---|---|
| **Model** | `claude-opus-5` — founder instruction, and it agrees with ROSTER-SIZE §4.3 |
| **Effort** | `xhigh` |

`xhigh` here and `high` for builder, for one reason: the perception loop is the highest-iteration
work in the roster, wall-clock is an admissible scarcity, and depth per pass reduces the number of
render cycles — each of which costs a server start, a capture and a re-read. Not `max`: 95 turns at
`max` exist on this machine and there is no single binding call in a design pass to protect.

Same blocking prerequisite as §3.1: `VALID_MODELS` at `schema-lint.js:97`.

### 4.2 Permissions

```yaml
tools: [Read, Write, Edit, Bash, Glob, Grep]
mcpServers: [playwright]     # WITHHELD until §4.5's three preconditions are met
```

Everything in §3.2 applies unchanged. One addition, and it is the sharpest hazard in this document.

> **The MCP grant lands outside every guard in this repository.** The `PreToolUse` matcher in
> `.claude/settings.json` is `Bash|Edit|Write|NotebookEdit`, so the hook is never invoked for an
> `mcp__*` call; and if the matcher were widened, `pre-tool-use.sh:342` is
> `*) # Unknown tool — allow` with no `mcp__` arm and no URL field to match on. Reproduced:
> `mcp__playwright__browser_navigate` to an external host → **exit 0 ALLOWED**
> (AGENT-ARCHITECTURE.md:125).
>
> Concretely, granting `playwright` to a `Write`-bearing container today adds: **unbounded network
> egress** from a context that has read the whole repo, and **arbitrary code execution in the page**
> via `browser_evaluate` and `browser_run_code_unsafe` — which have 154 and 69 real calls on this
> machine, so this is a used capability, not a theoretical one. Because the `Agent` path accepts no
> `disallowedTools`, once merged into the file **there is no way to take it back at a call.**

The boundaries designer is supposed to hold — no `browser_evaluate`, no `browser_run_code_unsafe`,
loopback-only navigation — are **prose, enforced by nothing**, and the file must ship saying that in
those words. Their real homes are E7 (`sandbox.network.deniedDomains`) and E8 (`disallowedTools` at a
workflow dispatch, which is the surface designer is dispatched from anyway).

### 4.3 Isolation

Per §2, plus the three deltas in §2.7: a port derived from the slice id, `bun install` on every
dispatch, and a gitignored capture path with the git SHA recorded. Branch
`designer/<campaign>-<slice-id>`.

### 4.4 Skills — three, and the current one deleted

```yaml
skills:
  - ui-visual-validator
  - web-design-guidelines
  - ui-typography
```

- **`ui-visual-validator`** — *"screenshot analysis, visual regression testing, and component
  validation … verify UI modifications have achieved their intended goals through comprehensive
  visual analysis."* This is literally the judging half of the perception loop, and it is the one
  skill in the library written for an agent that has already captured a render.
- **`web-design-guidelines`** — the written rule set the loop measures against when the project's own
  system is silent on a question. The `design` lens forbids taste (`lenses.yml:138`); this is what
  fills the space taste would otherwise occupy.
- **`ui-typography`** — carries an explicit **ENFORCEMENT MODE** (*"auto-apply every rule silently"*)
  and typography is the highest-frequency measurable defect class in generated UI. It maps directly
  onto Deviation Rule "auto-fix type scale."

**Delete `design-orchestration` (`designer.md:11`).** Its own description is *"orchestrates design
workflows by routing work through brainstorming, multi-agent review, and execution readiness."* That
is the orchestrator's job, injected pre-turn-1 into a producing container — which invites the
producer to route, plan and review, which is precisely the layer violation the roster exists to
prevent.

### 4.5 MCP servers — `playwright`, and only after three things

The decision is **YES** (ROSTER-SIZE §1, D3). The sequencing is not optional:

| # | Precondition | Why | State |
|---|---|---|---|
| 1 | `.mcp.json` **plus a per-agent server allowlist in `schema-lint.js`** | `mcpConfigured()` (`:85-93`) tests only that the file *exists*, so adding one flips the lint permissive for `mcpServers:` on **every** agent at once. The enabling change would otherwise trade a working check for a capability (ROSTER-SIZE D5) | Not started |
| 2 | **E7 configured** with `sandbox.network.deniedDomains` | The only mechanism that can bound egress from an `mcp__*` call | `grep -c '"sandbox"'` → 0 in both settings files |
| 3 | `bin/warroom:235,237` stops passing `--dangerously-skip-permissions` | Otherwise the permission classifier is off in every pane | Not started |

**Refused, and named so nobody re-proposes them:** `figma`, `pencil`, `stitch`, `refero`, `mem0`,
`miro`, `higgsfield`, `runpod` — all eight are live at user scope right now. Each would be a second
permanent grant on a `Write`-bearing container, and none has an artifact in this repository to act on
(no `.pen` file, no Figma file, no design corpus). A grant with no subject is decoration with a blast
radius.

**What closes the loop before E7 — and it is the better engineering answer for the capture half.**

> **Make the capture a committed script driven through `Bash`, not a model driving a browser
> click-by-click.** Bash is already granted. A script gives four things the MCP path cannot:
> it is **re-runnable by the reviewer** (a screenshot the producer took proves nothing; one the judge
> re-took does); it is **deterministic** across runs; it can run **in CI**; and — decisively — its
> URL argument lands in `tool_input.command`, which E2 **can see**. A loopback-only rule in the
> `Bash` arm of `pre-tool-use.sh` is buildable today and would be strictly stronger than any rule the
> MCP path can ever carry.

**This is not a workaround we invented; the field already ships the tool.** `playwright-cli` is a
separate artifact from the Playwright MCP server, and practitioners drive the visual-feedback loop
with it directly — `playwright-cli screenshot` and `playwright-cli show --annotate`, at v0.1.9
(azukiazusa.dev, accessed 2026-08-14). Two details from that account are worth taking:
**the snapshot is written in accessibility-tree format alongside the image**, which is precisely the
text artifact §6.2 step 3 depends on; and the `--annotate` flow hands the agent human feedback as
structured coordinates — `{ x: 336, y: 179, width: 612, height: 95 }: Change the placeholder to
'Enter username'` — which is the cleanest expression of the founder's variable-autonomy dial that
this research turned up: the same loop, with a human optionally in one step of it, and the feedback
arriving as data rather than as chat.

So the split is: **script for capture, MCP for exploration.** The deterministic half — navigate to a
route, set a viewport, drive to a named state, write a PNG **and an accessibility-tree snapshot** —
is a script, and it is what the loop runs on every iteration. The exploratory half — click through a multi-step flow, read the console,
inspect a hover state — is what `playwright` is for, and it arrives after the three preconditions.
One install-time friction to name honestly: fetching a browser binary is a network download, and
while `curl`/`wget` are blocked by E2 an `npx playwright install` is not matched by any rule. That
installation is a founder action, once, not an agent action.

### 4.6 Prompt strategy

As §3.6, with one addition. The design system is **written**, and the file must name its path rather
than describe it — see §6.1.

The non-sycophancy mechanisms are the same four, plus a fifth specific to rendering:
**`capture_method` is a required enum in the return with `source-fallback` as a legal value**
(§4.7). Making the honest answer *expressible* is what removes the incentive to claim a capture that
did not happen. `designer.md:79` already says source inspection *"must be labelled as one"* — today
there is no field to label it in.

### 4.7 Return contract

```js
const DESIGNER_RETURN = {
  type: 'object', additionalProperties: false,
  required: ['status','slice_id','branch','base','head','screens_touched',
             'capture_method','captures','summary'],
  properties: {
    status:  { type: 'string', enum: ['COMPLETE','PARTIAL','NEEDS_CONTEXT','BLOCKED'] },
    slice_id:{ type: 'string' }, branch: { type: 'string' },
    base:    { type: 'string' }, head:   { type: 'string' },
    files_changed:   { type: 'array', items: { type: 'string' } },
    screens_touched: { type: 'array', items: { type: 'string' } },
    capture_method:  { type: 'string', enum: ['script','browser','source-fallback'] },
    captures: { type: 'array', items: { type: 'object',
      required: ['screen','viewport_w','state','sha'], properties: {
        screen:{type:'string'}, viewport_w:{type:'number'}, viewport_h:{type:'number'},
        state: {type:'string', enum:['empty','loading','error','populated']},
        image_path:    {type:'string'},   // the PNG — taste evidence, may be absent
        snapshot_path: {type:'string'},   // a11y tree + computed styles — the half that closes
        sha: {type:'string'} } } },
    rule_deltas: { type: 'array', items: { type: 'object', properties: {
        rule:{type:'string'}, expected:{type:'string'}, measured:{type:'string'},
        screen:{type:'string'}, resolved:{type:'boolean'} } } },
    proposed_rules: { type: 'array', items: { type: 'object', properties: {
        gap:{type:'string'}, proposal:{type:'string'} } } },
    verification: { type: 'array', items: { type: 'object',
        required:['cmd','exit'], properties: {
        cmd:{type:'string'}, exit:{type:'number'} } } },
    claims_emitted: { type: 'array', items: { type: 'string' } },
    blockers: { type: 'array', items: { type: 'object', properties: {
        decision:{type:'string'}, why_blocked:{type:'string'} } } },
    summary: { type: 'string' },
  },
}
```

The load-bearing fields, against `designer.md:99-107` which has `rendered_evidence: {wide, narrow}` —
two opaque strings:

- **`captures[].sha`** — the commit the pixels were taken against. An mtime proves a file was written,
  not what it was written from (ROSTER-SIZE §4.3).
- **`image_path` and `snapshot_path` are separate and only `sha` is required of the pair.** Per §6.2,
  the accessibility-tree/computed-style snapshot is the artifact most findings are actually derived
  from, and it is text — so a run that captured the snapshot but failed the screenshot has lost its
  *taste* evidence, not its *measurable* evidence, and should say exactly that rather than collapsing
  to a single opaque failure.
- **`captures[].state`** as an enum of four — `designer.md:86` requires empty, loading, error and
  populated, and today nothing in the return can show whether they were covered. Now a script can
  count them.
- **`capture_method`** — §4.6.
- **`rule_deltas`** — the `design` lens refuses *"feedback such as 'the spacing looks off' with no
  measurement"* (`lenses.yml:143`). A finding must carry `expected` and `measured` or it is not a
  finding.
- **`proposed_rules`** — §4.9.

### 4.8 Stop and exhaustion

As §3.8, with one addition specific to rendering: **three failed capture attempts ⇒ PARTIAL with
`capture_method: 'source-fallback'`** (existing rule, `designer.md:90`), and that status must
propagate, because the three review lenses scoped `rendered-output` (`review-lenses.yml:69, 95, 108`)
cannot be satisfied by source and must not report a PASS as though they were.

### 4.9 Autonomy and escalation

**Auto-fix without asking:** spacing, type scale and colour, to match the *written* system. This is
narrow on purpose — the `design` lens refuses *"reviewing from source when the rendered output is
available"* and refuses personal taste, so anything not measurable against a written rule is not an
auto-fix.

**Forces BLOCKED:** the written system has no rule for the decision; a change would contradict a
locked decision; three failed captures.

**New, and it closes a loop that is currently open.** `designer.md:115` says *"DO NOT invent a design
rule. Return BLOCKED and let the system gain one deliberately"* — and there is **no path by which the
system gains one.** The fix is `proposed_rules` in the return: the designer may not *create* a rule,
but it may *propose* one, and the orchestrator writes the accepted proposal into the design system
file. Proposal is not authorship; the container boundary holds and the loop terminates.

### 4.10 Context on arrival

As §3.10, plus four things the brief must carry or the loop cannot start: **the design system path**
(§6.1), **the run command and the assigned port** (§2.7), **the routes in scope**, and **the base
commit**.

### 4.11 State and memory

As §3.11. One difference: captures are **binary and derived**, so they are written to a gitignored
path and referenced by path in the return, never committed to the feature branch. The durable record
is the `captures[]` manifest — screen, viewport, state, path, sha — which is small, diffable and
re-derivable.

### 4.12 Observability

As §3.12. The `designer/*` branch prefix is what makes a running design pass distinguishable from a
build in `ProjectView` and in `git worktree list`.

**Gap, and it is real:** no Mission Control view renders an image. The founder can see that captures
exist, at what SHA, in what state — and cannot look at them from that surface. Naming it rather than
implying otherwise: the captures are files on disk in a known worktree path, and looking at them is
today a `open <path>` in a terminal.

### 4.13 Failure modes and recovery

Everything in §3.13, plus:

| # | Mode | Who notices | Recovery |
|---|---|---|---|
| 10 | **Two designers on one port** — vite auto-increments and the capture silently shows the other agent's app | **Nobody, today** | Explicit `--port` from the slice id; the capture asserts the served build's SHA equals its own HEAD before believing a pixel |
| 11 | **Capture succeeded, showed a stale build** | Nobody | Same SHA assertion. This is why `captures[].sha` is required, not optional |
| 12 | **Rendered-output lenses pass on source evidence** | Nobody today | `capture_method: 'source-fallback'` must force those three lenses to `unresolved`, never `pass` — the same rule CLAUDE.md rule 10 already applies to resolvers |
| 13 | **Browser navigates to an external host** | Nobody | Exit 0 today (AGENT-ARCHITECTURE.md:125). E7 only |

### 4.14 Dispatch

As §3.14. Surface: `.claude/workflows/design.js` — **which must be rewritten before it can be used.**
It dispatches `agentType: 'product-designer'` (`:87`) and `agentType: 'design-critic'` (`:94`), both
of which are **retired names**, it carries craft specialisation as a prose instruction (`:80`) rather
than an injection, and it has been invoked **zero** times while `qa` ran 8 and `coding` 5. Its
fan-out-and-judge structure is sound and worth keeping; its dispatch targets are dead.

Concurrency: same ceiling of 4, and in practice lower, because each concurrent designer needs its own
port and its own `bun install`.

### 4.15 QA of the agent itself

As §3.15, plus one designer-specific check that should exist: **`schema-lint.js` should fail a
`mcpServers:` entry naming a server the per-agent allowlist does not permit** — the second half of
§4.5 precondition 1. Without it, `mcpConfigured()` is a file-existence test standing where a
capability check belongs.

### 4.16 Helpers

Everything in §3.16, plus the two that matter most here:

7. **The capture script** (§4.5) — start server on an assigned port, wait for ready, set viewport,
   drive to each named state, write `<screen>-<state>-<width>.png` **and the matching
   accessibility-tree/computed-style snapshot**, emit the manifest with the current HEAD sha.
   Deterministic, re-runnable by the reviewer, and its URL is visible to E2. `playwright-cli` already
   writes both artifacts (§4.5), so this is wiring, not invention.
8. **The measurable half of the critique should not be a model call at all.** Contrast ratio,
   tap-target size, overflow at 375px and missing states are *computed*, not judged. And this repo
   has already paid for the lesson:
   `mission-control/client/src/styles.css:24-25` records that every measured contrast figure in the
   file was **wrong — by 0.06 to 0.3, in both directions** — and had gone unchecked precisely because
   a human (or a model) reading a comment cannot tell. A script that parses the tokens and asserts
   ≥4.5:1 for anything carrying meaning would have caught all of them. That is the strongest
   available argument for a script over a judge, and it comes from inside this repository.

### 4.17 Migration

§7. `designer.md` is **`irreversible`** tier, and the `playwright` grant is a **separate PR after
E7**, also `irreversible`.

---

## 5. The builder/operator line — where domain becomes capability

The honest test the founder asked for: builder covers backend, frontend, database, AI, devops, data,
tests, docs and copy. **Where does a domain difference become a capability difference — a tool held
or denied, a credential, a sandbox — rather than a lens?**

Run it on the four sharpest cases and the line falls in the same place every time:

| Domain | Authoring | Acting | The line |
|---|---|---|---|
| **Migrations** | **builder** — writes a new `supabase/migrations/*.sql`. E2 permits it: `pre-tool-use.sh:317-321` blocks only edits to a file that *already exists* | **operator** — applying it to a database with customer rows in it | The credential. Authoring needs `Write`; applying needs a DB admin credential that exists only as an `mcpServers:` grant |
| **Deploys** | **builder** — writes the workflow, the config, the script | **operator** — running the promote | A worktree offers **zero** containment for an external mutation, so builder's entire containment story does not transfer. `isolation: none` is *correct* for operator and it is why the two cannot merge |
| **Secrets** | **neither** | **operator**, and never through the agent's context | `pre-tool-use.sh:162-163` blocks reading `.env` for *everyone*, because the contents would land in `~/.claude/projects/*.jsonl` permanently. The credential lives in the MCP server's own configured auth |
| **Payments** | **builder** — writes `**/api/billing/**`, `**/api/payments/**` code | **operator** — creating a live price or webhook endpoint | `qa-tier-floor.yml:96-105` already tiers all three path families `irreversible`/`block`. Someone wrote the money-flow rules for a business this roster has no container able to operate |

**The rule that generalises:** builder produces *artifacts in git*; operator mutates *state outside
git*. Everything a `git revert` undoes is builder's. Everything it does not is operator's. Every one
of the eight domains is a **lens plus a skill** on builder's side of that line, and a **credential**
on the other — and a credential is the one thing that can only be granted in a file, which is why
`operator` is a container and `backend-engineer` is not.

**Framing artifacts, now builder's.** With `framer` cut, builder produces specs, positions, pricing
cases and decision records. This needs **no capability change** — a spec is a file, `Write` writes it
— which is exactly why the cut is correct. What it *does* need is the mechanism `framer` was reaching
for: producer-cannot-close. That is carried by **a frozen artifact plus a recorded `baseline_commit`**
(ROSTER-SIZE §7.6), not by an author's tool list — and it is stronger, because it binds the artifact
rather than one author. Builder writes the spec; the spec is frozen at approval with its baseline
commit; review runs `git diff` from that point. Builder can then implement against a spec it can no
longer silently amend.

---

## 6. The perception loop, specified concretely

`designer.md:34` claims the loop — *"render, look, iterate"* — and `designer.md:6` grants no browser,
so it has never closed. Here is the loop as a mechanism, with each step named.

### 6.1 What it is measured against — the design system, and where it lives

**It exists, it is written, and it is `mission-control/client/src/styles.css`.** Its own opening line
is *"the whole design system, as tokens"*, and it carries: the dark-only decision and why there is no
toggle; a palette rule set (never `#000`, one accent meaning exactly one thing, no glow/gradient/
purple); a type rule (system sans and mono, no webfont, `tabular-nums` on every figure); and a
**measured contrast figure for every colour token**, with the instruction *"Re-measure before changing
a colour; do not carry a figure forward because it was in the comment."*

Two consequences for this spec: the designer's `pre_flight_reads` names **that path**, not "the design
system" in the abstract; and any second system for a second product goes in the same shape — tokens
with measured figures and stated rules — because that is the artifact `rule_deltas` measures against.

### 6.2 The loop

| Step | What happens | By what |
|---|---|---|
| **0. Standard** | Read `styles.css` and the `design` lens. Identify which rules this screen is measured against **before changing anything** — `designer.md:70`: "a change with no standard is a preference" | Read |
| **1. Build** | Edit the screen in the worktree | Write/Edit |
| **2. Render** | `bun install` if needed, start the dev server on the assigned port, wait for ready | **Script**, via Bash |
| **3. Capture — two artifacts, not one** | For each route × each of {empty, loading, error, populated} × each of {narrow 375, wide 1440}: drive to the state, then write **both** a PNG **and** a text snapshot (accessibility tree + computed styles), and record the HEAD sha | **Script** (§4.5) |
| **4. Compute** | Contrast ratios, tap-target sizes, overflow at 375px, missing states — all from the *text* snapshot, not the pixels | **Script** (§4.16 helper 8) — deterministic, no model |
| **5. Look** | Read the PNGs. This is the step that requires a model and the step that has never happened | Read (images) |
| **6. Judge** | Every finding as `{rule, expected, measured}`. Nothing without a stated rule | Model, against §6.1 |
| **7. Decide** | Any unresolved `rule_delta` at a state or width ⇒ iterate from step 1. No unresolved deltas **and** all four states captured at both widths ⇒ good | Arithmetic over `rule_deltas` and `captures` |
| **8. Terminate** | Three iterations without the unresolved count decreasing ⇒ PARTIAL. Three failed captures ⇒ PARTIAL with `capture_method: 'source-fallback'` | Counter |

**"Good" is not a feeling.** It is: zero unresolved `rule_deltas`, and `captures` covering four states
at two widths. Both are computable from the return object by a script, which is what makes the
termination condition real rather than a vibe.

**Why the capture writes two artifacts — this is the sharpest thing the field research changed.**
The loop does not have one closure property; it has two, and they close at different places. Per
*"Where Agents Can Check Their Own Work, and Where Not"* (digitalapplied.com, accessed 2026-08-14),
text-and-DOM output is *"the only rung where verification fully closes without human intervention"*
— *"the artifact is text all the way down. Markup, computed styles, console output, network
responses — an agent reads them the same way it reads source code."* It cites a five-point lift on a
WebVoyager subset (76.2% → 81.24%) from adding multimodal validation to web agents. But for
appearance beyond that it prescribes *"keep taste-level review only"* and, where a check does not
close, *"name the person."*

Split the loop on that line and it stops being one uncertain thing:

- **The measurable half is text, and the designer closes it alone.** Contrast, spacing, type scale,
  tap targets, focus order, missing states, overflow — all of these live in the accessibility tree
  and computed styles, which are text, and are therefore *self-verifiable* and, better still,
  *computable* (step 4). This is most of what a design pass actually gets wrong.
- **The taste half is pixels, and it does not close alone.** It goes to `reviewer` under `craft`, or
  to the founder. Naming that boundary is what stops the loop pretending to have judged something it
  cannot.

This also means the PNG is **not** the load-bearing artifact for most findings — which is why a
failed *image* capture should degrade to PARTIAL rather than abort, provided the text snapshot
landed.

### 6.3 The provenance problem, and why it needs no new container

ROSTER-SIZE cut `visual-referee` (§7.4), and correctly — but the objection is real: **a designer
judging its own render is the producer closing its own work**, which is the defect
`PHASE-8A-STATUS.md:174` names — *"It cannot prove a review happened — any artifact a reviewer
writes, a builder can write."* (ROSTER-SIZE §4.4 cites this as `:172`; the line is `:174`.)

It is solved without a container, three ways, all already available:

1. **The judging pass belongs to `reviewer`**, which holds `craft`, `voice` and `accessibility` —
   the three lenses at `scope: rendered-output` (`review-lenses.yml:69, 95, 108`) — and holds no
   `Write`, measured 0 across 4,373 calls. Designer's step 6 is an *iteration* judgement, not a gate
   verdict. The gate verdict is out-of-band, always.
2. **The capture is a script, so the reviewer re-runs it.** A screenshot the producer took proves
   nothing; the same script re-run at the same SHA by a container that cannot write is evidence. This
   is the single strongest reason capture must not be an interactive MCP session.
3. **The measurable half is arithmetic** (step 4), and arithmetic has no provenance problem.

What remains genuinely subjective — "does this read as calm" — stays with `reviewer` under `craft`,
and is exactly what `blocking_severities: [p1]` on that lens is for.

### 6.4 Has anyone solved "the producer judges its own output"? No — and the answer is a dispatch, not a role

The founder asked whether any of these projects has solved it without a second container. **Nobody
has, and two independent sources say so in almost the same words.**

- **obra/superpowers** (accessed 2026-08-14): *"Implementer self-review never replaces the task
  review; both are needed"* — and *"never skip the task review, and never accept a report missing
  either verdict."* The implementer does review itself; that review is simply not permitted to
  count.
- **digitalapplied** (accessed 2026-08-14): for anything past text and DOM, *"keep taste-level review
  only"*, and where the check does not close, *"name the person."*

**But the structural answer is better than "add a role," and it is the one this roster already
has.** Superpowers solves it with **two dispatches from one controller** — an implementer, then a
task reviewer, each with freshly-scoped context — and it explicitly *forbids* the implementer from
spawning that reviewer itself, because in real sessions *"every reviewer a worker spawned duplicated
the task review the controller dispatched anyway."* That is exactly `designer` → `reviewer`
dispatched by `orchestrator`, and it is the strongest external confirmation in this document that
ROSTER-SIZE's cut of `visual-referee` was right: the separation that matters is **who dispatches and
with what context**, not **how many role files exist**.

Two consequences that were not obvious before the research:

1. **A self-check is still worth running** — superpowers runs one — provided it is structurally
   incapable of closing the gate. Here that is guaranteed: the gate verdict comes from
   `gate-logic.mjs` arithmetic over `reviewer` findings, and `designer` cannot write into it.
2. **The `craft` lens should be honest that its final rung is human.** Where no check closes, the
   field's prescription is to name the person, and in this system that person is the founder at
   `gate: qa-verdict`. A `craft` p1 that no container can adjudicate is a founder decision, not a
   deadlock — the same shape as `designer`'s `proposed_rules` (§4.9).

---

## 7. Migration — from what exists to this spec

| # | Change | Tier | Blocks what |
|---|---|---|---|
| **0** | `schema-lint.js`: `VALID_MODELS` → the Claude 5 set; **add `effort`** to `REQUIRED_FRONTMATTER`; **remove `maxTurns`** (field `:71`, range check `:285`, advisory `:405`); add the per-agent MCP allowlist | **irreversible** (`.claude/hooks/**`, `qa-tier-floor.yml:84`) | Everything. No producer file can declare `claude-opus-5` until this lands |
| **1** | `plan.js` — emit `{id, agentType, brief, files}` under a schema; run the §2.4 overlap intersection; call `classify.mjs` for the tier | full (`scripts/**`) or lite (`.claude/workflows/**`, no rule ⇒ lite default) | `coding.js:22` refuses to run without it. **This is the gate on the whole spec** |
| **2** | Rewrite `builder.md` and `designer.md` per §3 and §4 — **without** `mcpServers:` | **irreversible** (`.claude/agents/**`) | — |
| **3** | `coding.js`: default-REF warning → **refusal** (§2.5); add the E6 checks (dirty worktree, landed diff); pass `effort`; use `BUILDER_RETURN` | lite | Correct gate input |
| **3b** | Worktree mechanics (§2.1, §2.6): add `.claude/worktrees/` to `.gitignore` and teach `collectors/worktrees.ts` about it, so `EnterWorktree`/`ExitWorktree` can be used; add the `git check-ignore` precondition and the `GIT_DIR`/`GIT_COMMON` detection; set `worktree.baseRef` | lite (`.gitignore`) + full (`mission-control/**` via `check:mc`) | `ExitWorktree`'s dirty-refusal guard — the only *runtime-enforced* piece of §2.6 |
| **4** | The capture script (PNG **and** a11y snapshot) + `scripts/worktree-sweep.mjs` + the contrast/state computation | full (`scripts/**`) | Designer's loop |
| **5** | Rewrite `design.js` — dead `agentType`s, prose-pointer skills (§4.14) | lite | Designer dispatch |
| **6** | The four-word `qa.js` fix: pass `agentType: 'reviewer'` at `:122, :132, :179, :199` | lite | Producer-cannot-close means nothing until this lands |
| **7** | E7 sandbox + drop `--dangerously-skip-permissions` from `bin/warroom:235,237` + `.mcp.json` | irreversible | The `playwright` grant |
| **8** | Add `mcpServers: [playwright]` to `designer.md` | **irreversible** | — |

**Steps 7 and 8 do not move before 0-6.** Shipping the grant first produces, in ROSTER-SIZE's own
words, a well-labelled front door beside an open window.

---

## 8. Open questions, and the probe that settles each

| # | Question | Probe | Until then |
|---|---|---|---|
| **Q1** | **Does frontmatter `isolation: worktree` create a worktree on its own, or only the dispatch option?** All measured evidence is about the dispatch (22 calls, 62 `worktreePath` records) | P1 (§2.1) — dispatch twice, with and without, diff `git worktree list --porcelain` | Declare **and** pass both |
| **Q2** | **What actually stops a run?** `maxTurns` does not bind, no `timeout?:` exists in the binary, stop reasons are unrecorded. **This is the biggest open question in this document** | P3 (§3.8) — join `agent-*.meta.json` to its `.jsonl` across 2,383 records and histogram the terminal state | Every exhaustion policy here is a guess and is labelled one |
| **Q3** | What is the right concurrency ceiling? Builder has never fanned out — 0 dispatches as an `agentType` | P2 (§2.3) — one campaign at N = 2, 4, 8; measure window consumption, wall-clock, conflicts | 4 |
| **Q4** | Does the browser grant actually raise defect detection? | ROSTER-SIZE F5 — 20 seeded rendered defects, browser-holding vs source-reading reviewer. **No lift ⇒ delete `designer.md` and retag the three lenses to `scope: diff-only`** | The grant is approved on requirements, not on measurement |
| **Q5** | Is Opus the right model for builder, given it is the fan-out container? | An A/B on real slices: Opus/high vs Sonnet-5/high, same briefs, gate verdict as the outcome. Anthropic's `skill-creator` ships the harness shape | Founder instruction stands: Opus |
| **Q6** | Does pasting a skill body into the brief actually change behaviour versus pointing at it? | The `design.js:80` pointer is the natural control — same task, pointer vs paste, count whether the procedure was followed | Paste |
| **Q7** | Does `EnterWorktree` work from a **subagent** dispatched with `isolation: worktree` — i.e. do the native tool and the dispatch option compose, or fight? Its own docs say a session "must not already be in a worktree session when creating a new worktree", and every producer here is dispatched from an orchestrator that is inside one | Dispatch one builder with `isolation: 'worktree'` and have it call `EnterWorktree`; record whether it errors, nests, or switches. Folds into P1 | Manual `git worktree add -C "$MAIN_REPO"`, which is what both files do today |
| **Q8** | Is the `.claude/agents/**` = `irreversible` ceremony what stops these two files improving? BMAD's `.customize.yaml` overlay is a real answer we rejected (§10.2) | Count, over the next quarter, how many producer-file improvements were deferred or skipped because of the tier | Reject the overlay; revisit on evidence |

---

## 9. Recommended deletions

Prefer deletion. Each of these is a thing that exists, does nothing, and costs something.

| Delete | From | Because |
|---|---|---|
| `maxTurns: 30` | `builder.md:7`, `designer.md:7`, and `REQUIRED_FRONTMATTER` / range check / advisory in `schema-lint.js` | Does not bind. A declared cap of 12 produced a 633-turn run. A safety property that is decoration is worse than none |
| `api-design-principles`, `error-handling-patterns` | `builder.md:11-12` | Backend skills injected pre-turn-1 into a container covering eight domains, including docs and copy |
| `design-orchestration` | `designer.md:11` | Routing procedure injected into a producing container — it invites the layer violation the roster exists to prevent |
| The default-REF **warning** | `coding.js:86` | Replaced by a refusal. A gate that reviews the wrong range and passes is worse than one that refuses |
| `agentType: 'product-designer'` / `'design-critic'` | `design.js:87, :94` | Retired names. The workflow cannot dispatch anything today |
| The prose skill pointer | `design.js:80` | A pointer on a channel that does not bind, standing where an injection or a pasted payload belongs |
| `return_contract:` as a *contract* | Both files (keep the key, relabel it) | `schema-lint.js:353` checks the key exists; `grep -rn return_contract scripts/ .claude/workflows/` → 0. Call it documentation in the file, so nobody mistakes it for enforcement again |
| `allowed-tools: Read, Write, Edit, Glob, Grep, Bash` | `.claude/skills/tdd-workflow/SKILL.md:4` | Not in the official SKILL.md format (anthropics/skills: `name` + `description`, `compatibility` rare), and it grants nothing — this runtime has no skills-level tool grant. A capability field that grants nothing is what `schema-lint.js` exists to catch, and it is currently sitting inside a skill the linter does not read. Next curation pass |

---

## 10. Conventions inherited, and from where

Sources read 2026-08-14. ROSTER-SIZE §3 surveyed eight of these systems for *structure and count*;
this section is narrower and different in kind — it takes **operating conventions for a producing
agent**, which is the layer that board did not need. Where a convention was already ours, it is
marked *confirms* rather than *adopted*, because independent arrival is evidence and re-badging it as
borrowing would hide that.

### 10.1 Adopted

| Convention | Source | Why it transfers |
|---|---|---|
| Detect existing isolation **before** creating: `GIT_DIR` vs `GIT_COMMON`, plus a submodule check | superpowers `using-git-worktrees` | Ours (`builder.md:66`) answers "where is main", never "am I already in a worktree" — and the orchestrator dispatching these producers is inside one right now |
| Assert the worktree directory is gitignored before creating it (`git check-ignore -q`) | superpowers `using-git-worktrees` | One line, fails closed, and we have never run it despite depending on the property |
| Prefer a **native** worktree tool over manual `git worktree add` | superpowers `using-git-worktrees` | This runtime has `EnterWorktree`/`ExitWorktree`, and `ExitWorktree` refuses removal of a dirty worktree — §2.6's rule, enforced by the runtime rather than by prose. Carries a real migration (§2.1) |
| Auto-install dependencies immediately after creating the worktree | superpowers `using-git-worktrees` Step 2 | Identical to Deviation Rule 4 (`bun install`), reached independently. `check.mjs:36` already detects the condition |
| **Run the tests before the first edit and record the baseline** | superpowers `using-git-worktrees` Step 3 | New to us, and it repairs a rule: without a baseline a producer cannot tell inherited breakage from its own, so every red test is a false BLOCKED or a temptation to edit someone else's expectation (§3.9) |
| Remove a worktree only from **outside** it; capture the path before changing directory | superpowers `finishing-a-development-branch` + issue #583 | #583 reports removal failing when cwd is inside the target. Mechanical, cheap, and we would have hit it |
| Refusal on uncommitted files is a **question**, never a forced delete | superpowers `finishing-a-development-branch`; `ExitWorktree`'s `discard_changes` guard | Same instinct as "never destroy the evidence of a failure", and here it is available as a runtime guard |
| The integration decision belongs to the human — merge / PR / keep, agent waits | superpowers `finishing-a-development-branch` | *Confirms* CLAUDE.md rule 8 |
| An explicit **no-subagents clause in the dispatch prompt**, in addition to the tool denial | superpowers `subagent-driven-development` | Gives the reason we lacked: every reviewer a worker spawned duplicated the controller's review. The denial binds; the sentence stops the agent spending turns discovering it |
| The brief is a **generated file with a path**, not pasted prose | superpowers `scripts/task-brief` | Deterministic, diffable, re-readable by the reviewer, and the structural defence against the 42k-character dispatch |
| **No session history in a dispatch** | superpowers `subagent-driven-development` | Sharper than the MAST statistic: a real session's dispatch hit 42,000 chars, 99% pasted history. That is our orchestrator's default failure |
| `BASE` recorded **before** dispatch, never `HEAD~1` | superpowers `scripts/review-package` | Independent arrival at §3.7's `base` field, for the same reason |
| `NEEDS_CONTEXT` as a status distinct from `BLOCKED` | superpowers | "Answer me and I continue" is a cheap round-trip; "I cannot proceed" frees a worktree. My first draft collapsed them |
| Self-review runs but **never replaces** the independent review | superpowers | The direct answer to §6.4, and it costs us nothing — our gate verdict is arithmetic the producer cannot write into |
| An **explicit read manifest with REQUIRED / conditional markers** | Spec Kit `implement.md` | Converts "should have read the spec" into a detectable halt instead of a plausible guess |
| An **artifact-existence precondition** before a stage opens | Spec Kit's checklist gate (`check-prerequisites.sh`) | *Confirms* ROSTER-SIZE §5.2, now with a shipped implementation behind it |
| Halt policy **differentiated by parallelism** — abort on a sequential failure, report a parallel one | Spec Kit `implement.md` | `coding.js:73-76` currently lets any one BLOCKED slice skip the gate for all of them |
| A small **index** read before the standards themselves, so context stays lean | Agent OS `index.yml` + `/inject-standards` | *Confirms* our two-tier router (`routers/INDEX.md`, ~1,070 tokens vs ~15,000 for the manifest) — reached independently by a system whose entire product is standards injection |
| Standards-file style: **rule first, reasoning after**; code examples; no unrelated concepts in one file | Agent OS | Directly applicable to `styles.css` and to any second design system (§6.1) |
| **Text and DOM self-verify; pixels do not** — instrument the rung, or name the person | digitalapplied, *"Where Agents Can Check Their Own Work"* | Splits the perception loop where it actually breaks, and makes most of it computable (§6.2) |
| Write an **accessibility-tree snapshot alongside the image**, via `playwright-cli` | azukiazusa.dev, Playwright CLI v0.1.9 | The text artifact the measurable half depends on, from a tool that is not the MCP server — so §4.5's script recommendation is not a workaround we invented |
| `SKILL.md` frontmatter is **`name` + `description`**, with `description` as the triggering mechanism | anthropics/skills `skill-creator` | The official format for the one channel we have measured to work |

### 10.2 Rejected, and why they do not survive here

| Convention | Source | Why not |
|---|---|---|
| Report findings by **appending to a file** rather than returning a structure | superpowers | They have no runtime-enforced return schema; the workflow surface here does (`agent(…, {schema})`), and a schema the runtime rejects beats a file convention an agent can forget. **Our measurement wins — but note we adopted the *brief*-as-file half, which has no such substitute** |
| **STOP and ask the user** mid-run | Spec Kit `implement.md` | A producer here has no channel to a human: `InboxView.tsx:3-4` records that nothing has ever written to `~/.<project>/messages/`, and E2 would refuse that write anyway. The equivalent is `NEEDS_CONTEXT` to the orchestrator |
| **`.agent.yaml` source compiled to `.md`, plus a `.customize.yaml` overlay** | BMAD v6 | It creates a second place that changes behaviour, and `.claude/agents/**` is `irreversible`/`block` precisely so agent identity cannot drift quietly. **Named cost, honestly:** every tweak to a producer is therefore full ceremony — 2-of-3 multi-judge plus founder sign-off — and BMAD's overlay is a real answer to that. Worth revisiting if the ceremony proves to be what stops the files improving |
| **Delete the agent files entirely** (8 → 0) | Agent OS v3 | Adjudicated upstream in ROSTER-SIZE §3 and not reopened: Agent OS did not prove agents unnecessary, it stopped attempting the work agents were for, and it has no field that expresses a capability grant |
| `[P]` **parallel markers** in the task list | Spec Kit | We get the same information from the job object's `files` array, which additionally supports the §2.4 overlap pre-check. A second encoding of one fact is two facts that can disagree |
| `toHaveScreenshot()` **pixel-diff** as the judge | Playwright | It detects *regression against a golden*, which presumes the golden is right. The loop here is judging new design against written rules. Genuinely useful later, as a guard on screens already accepted |
| `allowed-tools:` in `SKILL.md` frontmatter (present in our vendored `tdd-workflow`) | community skills | Grants nothing: there is no skills-level tool grant in this runtime (ROSTER-SIZE §2 table). It is decoration of the exact kind `schema-lint.js` exists to kill, and it should be stripped on the next curation pass |

### 10.3 Where the field and our measurements disagree

Three, stated so they are not smuggled past:

1. **Frontmatter richness.** anthropics/skills says `name` + `description`, with `compatibility`
   "optional, rarely needed." Our vendored skills carry `risk:`, `source:`, `tags:`, `last_updated:`
   and in one case `allowed-tools:`. Ours are local extensions, not the standard; only the two
   official fields are load-bearing anywhere.
2. **Worktree location.** The field's native-tool-first rule points at `.claude/worktrees/`; this
   repo's entire worktree apparatus — `.gitignore`, `.worktrees/.registry`, `collectors/worktrees.ts`
   — points at `.worktrees/`. We take the rule and pay the migration (§2.1) rather than either
   ignoring the tool or silently splitting worktrees across two locations.
3. **Worktrees themselves are contested.** superpowers issue #583 asked for isolation to be optional,
   on four concrete frictions, and was **closed as not planned** with the reporter forking. So this
   is a live disagreement in the field, not settled practice — and our answer (§2) is the same as the
   maintainers', now with the frictions named instead of discovered later.

**One inherited command was wrong on contact and had to be adapted, which is the argument for
running every borrowed command rather than transcribing it:** superpowers' `git check-ignore -q
.worktrees` reports "not ignored" in this repository even though `.worktrees/` is ignored at
`.gitignore:16` (§2.1 step 2). Two other conventions above — the native worktree tool and the
`.worktrees/` location — needed local adaptation for the same class of reason.

### 10.4 Sources

All accessed **2026-08-14**.

- obra/superpowers — [`using-git-worktrees`](https://github.com/obra/superpowers/blob/main/skills/using-git-worktrees/SKILL.md) · [`subagent-driven-development`](https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md) · [`finishing-a-development-branch`](https://github.com/obra/superpowers/blob/main/skills/finishing-a-development-branch/SKILL.md) · [issue #583, closed as not planned](https://github.com/obra/superpowers/issues/583)
- anthropics/skills — [`skill-creator/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)
- GitHub Spec Kit — [`templates/commands/implement.md`](https://github.com/github/spec-kit/blob/main/templates/commands/implement.md)
- Agent OS — [repo](https://github.com/buildermethods/agent-os) · [Defining Coding Standards](https://buildermethods.com/agent-os/standards)
- BMAD-METHOD — [repo](https://github.com/bmad-code-org/bmad-method) · [agent architecture](https://deepwiki.com/bmadcode/BMAD-METHOD/8.1-agent-architecture-and-lifecycle)
- [*Where Agents Can Check Their Own Work, and Where Not*](https://www.digitalapplied.com/blog/agent-self-verification-limits-by-output-modality-2026) — digitalapplied
- [*Giving AI Agents Visual Feedback with Playwright CLI*](https://azukiazusa.dev/en/blog/playwright-cli-ai-agent-visual-feedback/) — azukiazusa
- Founder's reference list: `~/Downloads/2025+ Agent File-System Repos  Skills, Prompts, Commands & Workflows (1).md`
- Already on disk, with provenance recorded in [`CURATION.yml`](../../../.claude/skills/CURATION.yml): `verification-before-completion`, `subagent-driven-development`, `receiving-code-review`, `writing-skills` (obra/superpowers) and `skill-creator`, `doc-coauthoring` (anthropics/skills)

---

*Written 2026-08-14 against commit `ca27022`. Every `file:line` was opened while writing; every
command output quoted was run on this machine on that date. The parts that are guesses — the
concurrency ceiling, the exhaustion policy, the effort split between the two producers — are labelled
as guesses in the section that makes them, and each carries the probe that would replace it with a
measurement.*
