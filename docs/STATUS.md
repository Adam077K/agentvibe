# Where we stand — 25 August 2026

**This is the one living status document.** By founder decision on 2026-08-25 the handoff chain retires
into this file: fifteen handoff documents accumulated in twelve days, several superseding each other, and
every future session paid to read the pile to find the two paragraphs that were still true.

Read this before starting. Correct it in place when it goes stale. **Do not open a new handoff beside it** —
that is the practice this file exists to end. The superseded handoffs are still on disk, bannered as
historical, because this repo keeps its wrong statements rather than quietly deleting them.

Every figure below was measured in the worktree that wrote this file, on 2026-08-25, unless the line says
otherwise. Where something is reported rather than measured here, it says so.

---

## The four things to know before touching anything

1. **`main` = `71fd58d`.**
2. **CI is RED and the local floor is GREEN.** Both are true, and they are one environment-dependent test
   apart. See §1.
3. **The QA gate has never produced a verdict.** `.qa/` does not exist in the tree at all — not an empty
   directory, absent. Every "the gate blocked" statement in the record describes a run whose output was
   read from a transcript, never a stored artifact.
4. **Scope stops before Phase 9, and no venture work has run through this harness yet.** Both are decisions
   with recorded costs, not oversights. See §6.

---

## 1 · The one red test — the hook is right, the test is wrong

CI has been red since 2026-08-24 on a single test:

`scripts/pre-tool-use.test.mjs:228` — *"ALLOWS a write to a file under `$HOME/.claude/plans/`"*. The hook
exits 2 (block) where the test expects 0 (allow).

**It is environment-dependent, and the environment is the whole explanation.** The test never creates the
directory it asserts on. Two independent lines in `.claude/hooks/pre-tool-use.sh` then do the right thing
for a directory that does not exist:

- the allowed-root loop skips any root that is not a real directory (`[ -d "$_allowed" ] || continue`), so a
  missing `$HOME/.claude/plans` is not an allowed root at all; and
- the ancestor walk resolves the nearest *existing* ancestor before comparing, so the probe escapes upward
  out of `plans/` into `~/.claude` — which is correctly refused, because a write to `~/.claude/settings.json`
  disarms every rule in the hook.

**The hook is correct. The test is not.** It passes on a developer machine where `~/.claude/plans` happens
to exist — verified: it exists on this machine — and fails on a CI runner where it does not. That is why
`main` was green locally and red in CI on the same commit.

**And a third control disagrees about the same directory.** The OS sandbox **denies** writes to
`~/.claude/plans/` while `.claude/hooks/pre-tool-use.sh` explicitly **allows** them: `.claude/settings.json`'s
`sandbox.filesystem.allowWrite` lists `~/.agentvibe`, `/private/tmp/claude-501`, `**/.worktrees` and
`**/.worktrees/**` — and not this directory (verified in this worktree).

That is the **third** instance of two controls disagreeing about one path, after the two risk classifiers
reconciled on 2026-08-16 and the `Write`-vs-Bash split recorded in
[08-agents_work/handoffs/2026-08-23-after-p0.md](08-agents_work/handoffs/2026-08-23-after-p0.md) §0 — and
**this one runs the other way round.** There, the sandbox *granted* `/private/tmp/claude-501` and the hook
*refused* it, so every lane edited through Bash because the Write tool would not. Here the hook allows and
the sandbox denies. Same defect class, opposite polarity, and it is the same directory whose absence turns
CI red. Write it down so it is not rediscovered a fourth time.

That handoff's own framing still applies: *"either the hook should permit what the sandbox grants, or the
sandbox should not grant it. Nobody has decided which."*

A fix is **in flight on `fix/plans-dir-test-hermetic`** and had not landed when this was written: that
branch pointed at `71fd58d` with zero commits ahead of `main`. *In flight, not verified here.* Re-derive
before believing either way — do not carry this sentence forward as fact.

## 2 · One red step hides twelve — a structural property of `ci.yml`

`.github/workflows/ci.yml` runs **30 steps in a single job (`checks`) with zero `if:` conditions.** All
three numbers were counted in this worktree. With no `if: always()`, the first failing step aborts every
step after it.

**The failing step is #18 of 30 (`Pre-tool-use hook`), so steps 19–30 — twelve of them — never execute.**
Among them: `Tier gate`, `Claim ledger`, `Merge gate`, `Sandbox config armed`, `Read-only probe`,
`Launcher permissions` and `Mission Control`. The ledger's own enforcement and the check that makes *"the
sandbox is armed"* a fact rather than a comment are both downstream of a test that was never a real defect.

This is the same shape as the defect found on 2026-08-25 one level down: `npm run check` chained its steps
with `&&`, so a failure at step 21 silently skipped nine more. That one is fixed —
`scripts/run-checks.mjs` now runs every step and names every failure. **CI has the identical disease and
has not been treated.** A fix is **in flight on `fix/ci-runs-every-step`**, likewise at `71fd58d` with zero
commits ahead when this was written. *In flight, not verified here.*

Six `check:`/`test:` scripts are themselves `&&` chains. `check:ledger` is the worst: a `test:claims`
failure skips `ledger lint`, `ledger build --check` and `ledger verify`. Cheapest high-value fix available.

## 3 · Branch protection does not bind on the path actually used

Reported by the team lead from the GitHub API on 2026-08-25 — **not verified in this worktree**, because
`gh` is denied by the agent sandbox's `denyRead` on `~/.config/gh`, which is working as intended:

- `enforce_admins: {enabled: false}`
- `rulesets: []`
- no CODEOWNERS
- required checks `["Deterministic checks", "Verify QA Lead PASS"]`, `strict: true`

Required status checks govern **the pull-request route only**. Direct pushes to `main` print
`Bypassed rule violations for refs/heads/main: 2 of 2 required status checks are expected` and succeed
having run none. Observed on 2026-08-23 and twice on 2026-08-25.

**So the gate's authority is a convention, not a control.** Every claim in this repo of the form "nothing
merges without the gate" is true only of the route people choose to take.

**The flip is DEFERRED to Wave 2, and the reason is a real ordering constraint rather than reluctance.**
`.github/workflows/qa-lead-pass.yml` triggers on `pull_request` only — verified in this worktree: its `on:`
block at `:45` names `pull_request` and there is no `push:` trigger anywhere in the file — while being a
*required* status check. Two consequences follow, and they are why flipping first would break the repo:

- with `enforce_admins: true`, a direct push to `main` could **never** satisfy a check that only ever runs
  on pull requests; and
- `warroom merge` merges into **local** `main` and never pushes, so it would produce commits that can
  never reach `origin`.

**Founder decision, 2026-08-25: fix `cmd_merge` to push a branch and open a PR first, then flip.** Order
matters — flipping first bricks the merge path that exists today.

**CODEOWNERS was dropped from the plan.** Branch protection carries no `required_pull_request_reviews` at
all, so `require_code_owner_reviews` is unset and a CODEOWNERS file would gate nothing; there is no
CODEOWNERS in the tree today (verified). On a solo repository it would also deadlock the only reviewer.

## 4 · The local floor is green

```
npm run check  →  30 of 30 passed · 0 failed
```

macOS, sandbox armed, measured 2026-08-25 at `71fd58d`.

**`30 of 30 · 0 failed` is the figure. It is not 29 and it is not 31.** The wall clock is a sample rather
than a fact and should not be pinned: the same suite on the same commit took 79.7s at the session root and
82.8s then 125.9s in the worktree that wrote this file. Wall-clock numbers here move with how many lanes
are building at once — `c-mission-control-cold-start` already flakes for exactly this reason.

**Measure it from the canonical worktree path and nowhere else.** `git worktree list` is the authority on
that path. This session lost a full check run to the trap: a stale path that had been removed underneath a
running shell reported `19 of 30` with seven `spawnSync npm ENOENT` failures and four apparent test
failures — every one an artifact of the wrong tree, and every one of those tests passed when re-run from
the real path. A wrong path errors loudly; a wrong *tree* answers you politely and incorrectly. Four agents
plus an orchestrator have now hit this exact seam.

## 5 · Build state

| Item | State |
|---|---|
| Phases 1–7 | DONE |
| Phase 8a (read plane) | DONE |
| Phase 8b (dispatch) | **BUILT, exit gate UNDISCHARGED** — the gate needs a second project with a ledger to receive claims, and none exists |
| Phase 9 (fleet rollout) | **NOT STARTED — out of scope by founder decision** |
| P0 (the gate) | CLOSED except item 6, `claim-judge-external` |
| P0.5 (provenance) | LANDED |
| P1 – P5 | NOT STARTED |

Sequence and rationale: [03-system-design/TARGET-ARCHITECTURE.md](03-system-design/TARGET-ARCHITECTURE.md)
§11. Note the plan's own numbering runs P0–P6 and its **P6 *is* the Phase 9 rollout** — the item excluded
from scope.

**Built is not the same as gated.** 8b is the standing example: it works end to end against one target and
its exit criterion is still undischarged. Do not read one as the other.

**117 session files** (`ls docs/08-agents_work/sessions/ | wc -l`), every one of them infrastructure. The
figure this file carried until today was 105.

## 6 · The four founder decisions of 2026-08-25

Recorded in full, with rationale and cost, as a single entry in
[../.claude/memory/DECISIONS.md](../.claude/memory/DECISIONS.md). In brief:

1. **Scope** — complete Waves 1–4 of the target architecture. **Phase 9 fleet rollout is excluded.**
2. **Review weight** — lean by default: three blinded reviewers plus the deterministic floor. The full
   `qa.js` gate runs only where `git revert` does not undo the damage: `.github/workflows/`,
   `.claude/agents/`, `.claude/hooks/`, the gate itself, credentials. Basis is this repo's own
   measurement — a 49-agent gate run cost ~3.3M tokens and found 3 P1s while missing the largest defect;
   three blinded reviewers found 7 P1s at a fraction of that.
3. **Venture work: not yet** — the harness is finished first. **The cost is recorded once and is not to be
   re-litigated:** every mechanism built in Waves 1–4 stays untested against work that is not the harness
   itself, and stop conditions 6 and 7 sit at maximum exposure. 117 session files, zero customer-facing
   work.
4. **Documentation** — one living STATUS; the handoff chain retires. This file.

## 7 · The wiring gap — specified, unreachable

Counted in this worktree across all six files in [../.claude/playbooks/](../.claude/playbooks/):

| Engine | `engine:` dispatch entries |
|---|---|
| `builder` | 4 |
| `sourcer` | 4 |
| `designer` | 2 |
| **`framer`** | **0** |
| `orchestrator` | 0 |

**`framer` is dispatched by nothing.** It is a fully specified engine with a lens, a prompt and a `maxTurns`
of 25, and no playbook can reach it.

**Three of six playbooks are named by no command.** `ship-feature` is named by `/build`, `/fix` and `/ship`;
`design-pass` by `/design`; `research-question` by `/research`. `launch-landing-page`, `price-a-product`
and `validate-a-market` are named by none.

**Three of four workflows are invoked by nothing.** `coding.js`, `design.js` and `research.js` appear only
in documentation and in their own source — no command file and no agent file calls them. Only `qa.js` is
referenced from live configuration.

This is stop condition 7 — *a mechanism nothing invokes* — sitting in plain sight, three times over.

## 8 · Operating rules earned the expensive way

Each of these cost a real failure. They are cheap to follow and the failures were not.

- **Measure at the canonical path**, from `git worktree list`. Use absolute paths; the shell cwd resets
  between calls. Re-derive state rather than carrying it forward.
- **Never mutate a tracked file in order to measure it.** Evaluate a copy. A ledger A/B once wrote a
  historical file over the tracked one and the worktree lied to every observer for the duration.
- **Assert facts, never a formatter's wording.** A test asserting `ℹ tests 1` passed on Node 24, could not
  pass on CI's Node 20, and turned `main` red.
- **Never trust a subagent's silence, or its report, without checking.** Nine of nine reviewers across two
  sessions completed their analysis and never sent it; one said so outright. A subagent that stops early
  reports as *available*, which reads exactly like *reviewed it, found nothing*.
- **The failure is silent because the wrong answer is well-formed.** Every defect found on 2026-08-25 was
  this shape, and **not one was caught by a check** — each was caught by an agent reading a claim against
  the thing it described.
- **When you change a thing, re-derive everything that rested on it.**

## 9 · Where the record lives

| For | Read |
|---|---|
| Current state | **this file** |
| The plan | [03-system-design/TARGET-ARCHITECTURE.md](03-system-design/TARGET-ARCHITECTURE.md) |
| Decisions and their rationale | [../.claude/memory/DECISIONS.md](../.claude/memory/DECISIONS.md) |
| Durable facts, mechanically checked | [03-system-design/CLAIM-LEDGER.md](03-system-design/CLAIM-LEDGER.md) |
| What the sandbox does and does not contain | [03-system-design/SANDBOX.md](03-system-design/SANDBOX.md) |
| The last handoff, kept for its method section | [08-agents_work/handoffs/2026-08-26-the-gate-refused-its-author.md](08-agents_work/handoffs/2026-08-26-the-gate-refused-its-author.md) |
| Superseded numbering — do not follow | [03-system-design/IMPLEMENTATION-PLAN.md](03-system-design/IMPLEMENTATION-PLAN.md) |

Everything else under `docs/08-agents_work/handoffs/` is **historical**. It is bannered as such and retained
deliberately; read it for reasoning, never for current state.
