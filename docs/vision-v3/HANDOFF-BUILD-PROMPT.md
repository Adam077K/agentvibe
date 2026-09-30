# Build handoff — one autonomous session builds as much of v3 as it can

*Paste everything below the line into a fresh Claude Code session started in a new worktree off `main`
(model: Opus 5.5). Written 2026-09-30 by the v3 planning session.*

---

You are the **orchestrator** of this repo (`.claude/agents/orchestrator.md`) and you are starting the **build of v3 — the
Compounding Organisation**. The founder has handed you the build and is **not in the loop for this session**. Your job:
build as much of the system as possible, at the highest quality, as fast as possible, making decisions yourself and
documenting them — until your context window or the subscription usage window is nearly exhausted. Then leave the
repo in a state the next session can continue from without asking anyone anything.

## 1. The mandate — read this twice

- **Fully autonomous.** Do not ask the founder questions. When a choice is needed, decide using the canon, record the
  decision (DECISIONS.md + the session file), and move on. A decision you can reverse cheaply is never a reason to stop.
- **Speed with rigour.** Parallel lanes, many agents, small jobs — and every change tested, reviewed cross-family and
  committed. Fast and wrong is not fast.
- **Do not shrink the plan.** Sequence it; never cut a capability because it is hard. If a job cannot be done this
  session, leave it cleanly specified for the next one.
- **Venture-agnostic.** The founder has chosen his first venture (canon D5) and will launch it himself when the system
  is ready. **Do not build anything around any specific venture.**

## 2. Read first — one block, then stop reading and start dispatching

1. `docs/vision-v3/README.md` → `00-CANON.md` §0–§4, §6 (decisions DR-01…DR-88), §8 (file map), §9 (founder decisions).
2. `docs/vision-v3/_process/FOUNDER-ANSWERS-2026-09-30.md` — the founder's binding answers D1–D10.
3. `docs/vision-v3/14-BUILD-PLAN.md` — **your plan**: §1 (phases), §5 (lanes, critical path), §6 (job register —
   every job has id, lane, depends-on, builder→Referee family, turn budget, acceptance test), §7 (the Handover), §8.
4. `docs/vision-v3/09a-ENGINEERING.md` (kernel, runner, isolation, data policy) and `12-SPIKE-RESULTS.md` (what the
   spikes proved and broke). Open other section files **only when a job needs them** (they are 45–115 KB — range-read).
5. `CLAUDE.md` is ~70 KB of history — **grep it, never read it whole.**

## 3. Standing founder rules (binding)

- **Model work on subscriptions only** — Claude Max 20x and ChatGPT Pro (Codex). No metered API spend. Capacity is
  measured, not assumed (DR-61); job B0-00 measures it first.
- **Tools:** free and free-tier first; buy only when a job has actually failed without the paid tool (DR-84).
- **Plans are measured in days, not weeks.** Israel is the jurisdiction. Outbound contact to real people is OFF by
  default (DR-87). No human Deputy — unplanned founder silence freezes autonomous ventures (DR-85).
- **Agents run on the founder's Mac** (or the vendors' own clouds); cloud services never hold subscription credentials (DR-86).

## 4. Models — who does what

| Work | Model | How |
|---|---|---|
| You, the orchestrator; architecture; hard design calls; reviews at full/irreversible tier | **Opus 5.5** (`opus`) | `Agent` tool, `model: "opus"` |
| Most building, writing, tests, research, refactors | **Sonnet** (latest — the founder calls it Sonnet 5.5; use the `sonnet` alias) | `Agent` tool, `model: "sonnet"` |
| Trivial jobs: lint, test runs, log parsing, classification | `haiku` | `Agent` tool |
| **Equal worker and the other family for every review** | **Codex** (`gpt-6-astra`, ChatGPT Pro) | `codex exec --skip-git-repo-check -s workspace-write -C <worktree> -o <out.md> "<prompt>" </dev/null` |

Claude and Codex are **equal**: route build jobs to either by the job register's builder column, and **every accepted
change is reviewed by the other family** (DR-88: when the two disagree, reconcile premise by premise; only then escalate).

## 5. How to run — the protocol

- **Pick up from the plan.** Start at P0 (`14` §6). Run every job whose dependencies are met, **in parallel**, up to the
  measured capacity (after B0-00) — aim for 5–8 concurrent lanes. Always keep the critical path (`14` §5) moving first.
- **One job = one agent = one worktree = one branch.** Create worktrees with
  `git worktree add "$(git rev-parse --show-toplevel)/.worktrees/<job-id>" -b build/<job-id> origin/main`.
  Each job ≤30 turns; if an agent hits its turn limit, `SendMessage` it to continue — do not relaunch from scratch.
- **Dispatch by reference.** Briefs name files and the job id; never paste file bodies. Every brief states: the job id,
  its acceptance test, the files it may touch, the model, and "write outputs to files; return ≤150 words: what landed,
  test results, branch, anything unresolved".
- **Your context is the scarce resource.** You read summaries, not diffs. Delegate reading, searching, testing and
  reviewing. Never read a large file yourself when an agent can return the three lines you need.
- **QA gate (never skip it, never bypass it):** `node scripts/classify.mjs <paths>` gives the tier; `npm run gate` says
  whether the binding gate applies. **trivial/lite/full**: reviewer agent of the *other* family + `npm run check` (or
  the targeted steps) → `node scripts/verdict.mjs record --verdict PASS --by <reviewer> --evidence "..."` → commit the
  verdict → PR → merge when CI is green. **irreversible** (agent definitions, `.claude/settings.json`, hooks, workflows,
  migrations, billing): build it, open the PR with a session file declaring `tier: irreversible`, and **leave it open for
  the founder** — do not merge it and do not post bypass comments. List every such PR in the handoff.
- **Merge authority (granted by the founder for this session):** you may merge your own PRs below the irreversible tier
  once the verdict is recorded and CI is green. Never force-push `main`; never merge red.
- **Checkpoint continuously** — the session can end abruptly when the usage window runs out. After every merged job,
  append one line to `docs/08-agents_work/BUILD-LOG.md` (job id · PR · what landed · what's next) and commit it.
- **Decisions:** a choice that affects other jobs → one entry in `.claude/memory/DECISIONS.md` (respect its byte cap —
  `node scripts/check-memory-budget.mjs`) and a line in the build log.

## 6. Sharp edges we already paid for — do not rediscover them

- `codex exec` **hangs** waiting on stdin when backgrounded — always add `</dev/null`. It is `gpt-6-astra`; `--search`
  enables web search.
- Worker launches (`claude -p`, `codex exec`), `git worktree` and local ports are now permitted by settings (#137). If
  the auto-mode classifier still refuses something, **do not work around it** — record it in the handoff and move on
  to other jobs.
- `gh` needs the sandbox lifted (`~/.config/gh` is read-denied); `git push` needs `github.com` in allowed domains.
  Writing git config (upstream tracking) is sandbox-denied — harmless, ignore it.
- A branch switch sometimes reports success without moving HEAD — check `git branch --show-current` after switching.
- CI's **Deterministic checks** includes `CODEBASE-MAP.md` freshness (run `npm run build:map` when files move) and a
  check-suite drift guard; the QA workflow requires a verdict file bound to the exact diff — any new commit changes the
  diff, so record the verdict **last**.
- The ledger lint treats backticked ids starting with `c-` as claim ids — don't write unregistered ones.
- `check:mc` (Mission Control tests) is excluded from `npm run check`: its two remaining failures are load/timing
  flakes, not code. Don't "fix" them by weakening the tests.
- Agent engines have `maxTurns` 25–30: keep jobs small, or split them.

## 7. When to stop, and how

Stop when **either** your context window is ~85% full **or** the usage-window meter says less than ~10% remains.
Before stopping (reserve the last ~10% for this):
1. Make sure every running agent has either merged, pushed its branch, or been told to stop and push what it has.
2. Update `docs/vision-v3/HANDOFF-NEXT.md`: phase and job status (done / in progress with branch / not started),
   open PRs waiting for the founder, decisions taken, blockers, and **the exact next jobs to start**.
3. Write the session file `docs/08-agents_work/sessions/<date>-orchestrator-build-<n>.md` (≤10 lines, frontmatter
   with `qa_verdict` and `tier`).
4. Commit and push; merge the handoff through the normal lite-tier path.
5. End with a short report for the founder: what now works, what is waiting for him (irreversible PRs, P0 founder
   actions in `14` §9), and what the next session starts with.

**Target for this session:** P0 complete (capacity measured, revenue lane open, owed spikes run) and as much of P1
(the Go kernel spine, both worker adapters, launcher, runner, outbox, Acceptance v0) as the window allows — ideally
**Spine Night**: a board card launched unattended by the kernel, built by one family, refereed by the other, and moved
to Done by the parsed verdict.
