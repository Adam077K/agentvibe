# Where we stand — 26 August 2026

**This is the one living status document.** By founder decision on 2026-08-25 the handoff chain retires
into this file: **fourteen** handoff documents accumulated in twelve days (2026-08-14 to 2026-08-26),
several superseding each other, and every future session paid to read the pile to find the two paragraphs
that were still true.

> *Superseded 2026-08-26: this said **fifteen**, and so does `_TEMPLATE.md`. Fifteen is `ls | wc -l`, which
> counts `_TEMPLATE.md` — a file that is not a handoff and never was. Derive it as
> `ls docs/08-agents_work/handoffs | grep -c '^2026-'` → **14**. Corrected in both places. The point the
> figure was making is unaffected, which is exactly why nobody checked it.*

Read this before starting. Correct it in place when it goes stale. **Do not open a new handoff beside it** —
that is the practice this file exists to end. The superseded handoffs are still on disk, bannered as
historical, because this repo keeps its wrong statements rather than quietly deleting them. Verified here:
13 of the 14 carry the banner in their first six lines, and the one that does not is the newest.

**The evidentiary standard, and how to read a line that does not meet it.** Every figure below was
**re-derived in this worktree on 2026-08-26**, with the command shown wherever it is short enough to fit.
Two kinds of statement do not meet that standard and both are marked where they appear:

- **`REPORTED`** — from outside this tree (the GitHub API, a CI run, another agent). It says who reported
  it, when, and that it is *not verified in this worktree*. `gh` is unreadable from here by design — the
  sandbox's `denyRead` covers `~/.config/gh` — so no GitHub fact on this page can be anything else.
- **`SUPERSEDED`** — a statement kept beside its correction, in a blockquote, dated. It is history, not
  state. Never carry one forward.

> *Superseded 2026-08-26: line 11 read "Every figure below was measured in the worktree that wrote this
> file, on 2026-08-25, unless the line says otherwise." The standard was right and the file did not meet
> it: six passages described the state of `main`, not of the tree this file shipped in, and three
> GitHub-derived claims carried no attribution while a fourth, two sections down, carried it correctly.
> One standard, two labelling practices, and the reader could not tell which they were holding.*

## The rule this file follows

**STATUS.md is edited in the LAST commit of the change that ships it, after every other commit in that
change is already in the tree — including, in a merge train, after the merges.** Re-derive every figure at
that point. Nothing else in a change may depend on STATUS.md being written first.

**Why that rule and not "describes merged state only; in-flight work is named as such and dated".** The
weaker rule was already being followed and did not help. On 2026-08-25 this file described two fixes as *"in
flight on `fix/plans-dir-test-hermetic`"* and *"in flight on `fix/ci-runs-every-step`"*, correctly, dated,
with the hedge *"in flight, not verified here"* attached to both. Then all three branches merged into one
integration branch and **the merge falsified the document without editing it.** A living status that ships
in the same change as the thing it describes will hit that every time, because the branch is written before
the merge exists. Only ordering fixes it: write the status last, when the tree it describes is the tree it
ships in.

The cost is real and accepted: the last commit of a change is the one most likely to be rushed. That is a
better failure than the one this rule replaces, because a *missing* update is visible in a diff and a
*silently falsified* one is not — the six passages corrected on 2026-08-26 all read as confident present
tense and every one of them described a state the same commit had already removed.

---

## The four things to know before touching anything

1. **`main` = `71fd58d`** (verified here: `git rev-parse --short main`). This document now sits **ahead** of
   it, on `integration/wave-1`, and describes **this tree**, not `main`.
2. **The local floor is GREEN — `43 of 43 passed · 0 failed` — and the cause of CI's red is fixed in this
   change, though no runner has confirmed that from here.** See §1 and §4.
   > *Superseded 2026-08-26. This read: **"CI is RED and the local floor is GREEN.** Both are true, and they
   > are one environment-dependent test apart." That was true of `main` at `71fd58d` and false of the tree
   > this file ships in: `fix/plans-dir-test-hermetic` is merged here as `ae7ea48`. Kept because the
   > single-test explanation in §1 is still why CI was red, and a reader who cannot see the old state cannot
   > judge whether the fix addresses it.*
3. **The QA gate has never produced a verdict.** `.qa/` does not exist in the tree at all — not an empty
   directory, absent. Every "the gate blocked" statement in the record describes a run whose output was
   read from a transcript, never a stored artifact.
4. **Scope stops before Phase 9, and no venture work has run through this harness yet.** Both are decisions
   with recorded costs, not oversights. See §6.

---

## 1 · The one red test — FIXED HERE. The hook was right, the test was wrong

**`REPORTED`, not verified here: CI was red from 2026-08-24 on a single test.** No CI run can be read from
this worktree — `gh` is denied by the sandbox's `denyRead` on `~/.config/gh` — so the redness itself is
secondhand throughout this section. What *is* verified here is the cause and the fix.

The test: `scripts/pre-tool-use.test.mjs`, **the case titled *"ALLOWS a write to a file under
`$HOME/.claude/plans/` — plan-mode storage"***. The hook exited 2 (block) where the test expected 0 (allow).

> *Superseded 2026-08-26: this cited `scripts/pre-tool-use.test.mjs:228`. That line is now a **comment**.*
>
> *No corrected line number is given, and the reason is that the correction rotted twice while being
> written: the hermetic-`$HOME` fix moved the case from `:228` to `:306`, and the fixture-base fix later
> the same day moved it to `:341`. A `path:line` locator into a file the same change edits is not a
> citation, it is a race. Find it by title — `grep -n 'ALLOWS a write to a file under'`.*
>
> *Note also what could not have caught this: `npm run check:citations` existence-checks the **file**, not
> the line, so a rotted `path:line` is structurally outside its reach. Nothing in this repo checks line
> pins, which is the argument for not writing them rather than for adding a checker.*

**It was environment-dependent, and the environment was the whole explanation.** The test never created the
directory it asserts on. Two independent lines in `.claude/hooks/pre-tool-use.sh` then do the right thing
for a directory that does not exist:

- the allowed-root loop skips any root that is not a real directory (`[ -d "$_allowed" ] || continue`), so a
  missing `$HOME/.claude/plans` is not an allowed root at all; and
- the ancestor walk resolves the nearest *existing* ancestor before comparing, so the probe escapes upward
  out of `plans/` into `~/.claude` — which is correctly refused, because a write to `~/.claude/settings.json`
  disarms every rule in the hook.

**The hook was correct. The test was not.** It passed on a developer machine where `~/.claude/plans`
happens to exist — verified: it exists on this machine — and failed on a CI runner where it does not. That
is why `main` was green locally and red in CI on the same commit.

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

**LANDED IN THIS CHANGE, as `ae7ea48`** (`git merge-base --is-ancestor ae7ea48 HEAD` → true). The fix pins
`$HOME` to a fixture built outside every root the hook already allows, so the case no longer reads the
developer's home; and on CI an unbuildable fixture **fails rather than skips**, because a skip on the one
machine whose verdict blocks a merge reports "checked" for something never checked.

Measured here, agent shell, sandbox armed: `npm run test:pre-tool-use` → **166 tests · 166 pass · 0 fail ·
0 skipped**.

Two things a reader should not over-read:

- **Zero skipped is itself a fix made on 2026-08-26, not a property of the merge.** As merged, five cases —
  including *"BLOCKS a write to `$HOME/.claude/settings.json`"*, the write that disarms every rule in the
  hook — **skipped** in an agent shell, because `os.tmpdir()` there is `/private/tmp/claude-<uid>`, a root
  the hook allows, and `/tmp` is EPERM. `qa.js` runs `npm run check` as its oracle in exactly that shell and
  sets no `CI`, so the gate's floor was where the coverage went missing. Fixed by adding `~/.agentvibe` as a
  neutral fixture base and by making "every base is one of the hook's own roots" a **failure** rather than a
  skip; "genuinely unwritable" stays a skip off CI. Fixture-selection defect and locked-down laptop are not
  the same report.
- **No runner has confirmed the original redness is gone.** That needs CI, which cannot be read from here.

> *Superseded 2026-08-26. This read: "A fix is **in flight on `fix/plans-dir-test-hermetic`** and had not
> landed when this was written: that branch pointed at `71fd58d` with zero commits ahead of `main`. In
> flight, not verified here." Every word was true when written and false by the time the file shipped —
> the branch is two commits ahead of `main` and merged into the tree this document sits in. This is the
> passage that produced the ordering rule at the top of the file.*

## 2 · One red step hides twelve — a structural property of `ci.yml`

**TREATED IN THIS CHANGE, as `e5eac9f`** (`git merge-base --is-ancestor e5eac9f HEAD` → true).

`.github/workflows/ci.yml` now runs **44 steps in a single job (`checks`), and all 44 carry
`if: ${{ !cancelled() }}`.** Counted here:

```
grep -c '^        run: ' .github/workflows/ci.yml                    →  44
grep -c '^        if: ${{ !cancelled() }}' .github/workflows/ci.yml  →  44
```

Three further `uses:` setup steps (checkout, setup-node, setup-bun) carry **no** `if:`, deliberately: if
checkout fails, `!cancelled()` is still true, so guarding them would run all 44 checks against an empty
workspace and produce ~45 red steps instead of one. That is a diagnosability cost, not a fail-open one — the
job still fails and nothing ships. `!cancelled()` and not `always()`, so a cancelled run still stops.

> *Superseded 2026-08-26. This read: "`.github/workflows/ci.yml` runs **30 steps in a single job (`checks`)
> with zero `if:` conditions.** All three numbers were counted in this worktree… **The failing step is #18
> of 30 (`Pre-tool-use hook`), so steps 19–30 — twelve of them — never execute.** Among them: `Tier gate`,
> `Claim ledger`, `Merge gate`, `Sandbox config armed`, `Read-only probe`, `Launcher permissions` and
> `Mission Control`… A fix is **in flight on `fix/ci-runs-every-step`**, likewise at `71fd58d` with zero
> commits ahead when this was written."
>
> Every figure was correct **for `main` at `71fd58d`**, and re-derivable there today —
> `git show 71fd58d:.github/workflows/ci.yml` gives 30 run-steps and 0 `if:` lines, with
> `npm run test:pre-tool-use` as the 18th. It was already false of the tree the sentence shipped in. Kept
> because the twelve skipped checks are why the change exists: a reader who cannot see what was hidden
> cannot judge whether guarding 44 steps was the right cure.*

This was the same shape as the defect found on 2026-08-25 one level down: `npm run check` chained its steps
with `&&`, so a failure at step 21 silently skipped nine more. Both are fixed now, at both levels.

**The six `&&` chains are gone from the suite, and that is the "cheapest high-value fix" this line used to
recommend.** Six `check:`/`test:` scripts are still `&&` chains in `package.json` — `check:ledger`,
`check:warroom`, `check:dispatch`, `check:dispatch-prompt`, `check:memory`, `check:citations` — but **none
of them is a step of anything any more**: each is an EXCLUDED alias kept only because docs cite the
spelling, and its links are steps in their own right, in `npm run check` and in `ci.yml`. Derived here: 6
governed `&&` chains, 0 of them in `STEPS`, 6 of 6 carrying an `EXCLUDED` entry. `scripts/lib/check-suite.js`
now refuses a step whose **resolved** command carries `&&`, `||`, `;`, `|`, `&` or a newline — following the
`npm run` delegation chain, because a one-hop wrapper defeated the earlier `&&`-only check outright.

> *Superseded 2026-08-26: "Six `check:`/`test:` scripts are themselves `&&` chains. `check:ledger` is the
> worst: a `test:claims` failure skips `ledger lint`, `ledger build --check` and `ledger verify`. Cheapest
> high-value fix available." The count is unchanged and the recommendation is discharged — the chains were
> taken off the execution path rather than rewritten, which is why the six are still there.*

## 3 · Branch protection does not bind on the path actually used

**`REPORTED`** by the team lead from the GitHub API on 2026-08-25 — **not verified in this worktree**,
because `gh` is denied by the agent sandbox's `denyRead` on `~/.config/gh`, which is working as intended.
This is the labelling every GitHub-derived claim on this page now carries; §1's opening sentence did not
carry it until 2026-08-26, and neither did `ci.yml`'s header:

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
npm run check  →  43 of 43 passed · 0 failed · exit 0
```

macOS, sandbox armed, measured 2026-08-26 in this worktree on `fix/wave-1-review-findings`, with the tree
at `833b4d8` — the commit before this file's own — plus this file's edits, which no step reads. Derive the
denominator, never quote it:
`node -e "console.log(require('./scripts/lib/check-suite.js').STEPS.length)"` → **43**.

**`43 of 43 · 0 failed` is the figure. It is not 42 and it is not 44.**

> *Superseded 2026-08-26: this read "**`30 of 30 · 0 failed` is the figure. It is not 29 and it is not
> 31.** … measured 2026-08-25 at `71fd58d`." Correct at `71fd58d` and re-derivable there —
> `git show 71fd58d:scripts/lib/check-suite.js` still gives `STEPS.length` = 30. The denominator moved to 43
> because five `EXCLUDED` aliases were split into the 18 links they had been hiding behind five names, so
> the suite runs the same work under more names. **Nothing was added to the suite and nothing was dropped
> from it.** The hedge kept its own advice — pinning the exact figure is what made this correctable at all,
> where a vague "the floor is green" would have survived the change untouched and told the reader nothing.*

The wall clock is a sample rather than a fact and should not be pinned: this run took **79.4s** by the
runner's own tally and 80s by the shell, and the same suite on the same commit took 79.7s at the session
root and 82.8s then 125.9s in the worktree that wrote the previous version of this file. Wall-clock numbers
here move with how many lanes are building at once — `c-mission-control-cold-start` already flakes for
exactly this reason.

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

**119 session files** (`ls docs/08-agents_work/sessions/ | wc -l`), every one of them infrastructure.

> *Superseded 2026-08-26: **117**, with the same derivation command printed beside it. The command was
> right and the number was two behind. This file carried **105** before 2026-08-25.*
>
> *It went stale twice inside one change, which is the useful part. It was 117 as merged; re-deriving on
> 2026-08-26 gave **118**; and writing this session's own file took it to **119** — so the figure moved
> again after the correction was drafted. That is precisely the case the ordering rule at the top of this
> file exists for, and it is why the rule is about WHEN the number is taken rather than about taking more
> care: a derivation published beside a stale value reads as evidence and is not.*

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
   itself, and stop conditions 6 and 7 sit at maximum exposure. 119 session files, zero customer-facing
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
