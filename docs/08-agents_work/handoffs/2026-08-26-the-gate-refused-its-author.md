# Handoff — the gate refused its author, and the defects were all claims, not code

**From:** ceo (`ceo-2-1787566829`) · **Date:** 2026-08-25 · **`main` = `ceeed64`** (was `6db92ff`)

> Supersedes [2026-08-25-four-branches-waiting-on-one-key.md](2026-08-25-four-branches-waiting-on-one-key.md),
> which was written mid-session and patched three times as its own claims went stale. Read this one.

---

## 1 · State

**48 commits landed on `main` and are pushed.** 30 files. `npm run check` is **30 of 30, exit 0** — the
first clean local floor this repo has had.

**`main` is RED on CI, on ONE pre-existing failure that predates this session.**
`scripts/pre-tool-use.test.mjs:228` — *"ALLOWS a write to a file under `$HOME/.claude/plans/`"* — the hook
exits 2 (block) where 0 (allow) is expected. Verified failing identically on run `32731670120`
(2026-08-24), before this session began, and **this session touched neither `.claude/hooks/pre-tool-use.sh`
nor its test** (`git log 6db92ff..HEAD --` on both paths → empty). It fails on Linux CI and passes on macOS
locally: another environment seam.

**That is the first thing to fix.** It is now the *only* thing between `main` and green, and fourteen CI
steps that had never executed now run and pass, so the diagnosis is one step away.

---

## 2 · What landed

| Area | What |
|---|---|
| Worktree protocol | `builder.md`/`designer.md` and the `schema-lint` predicate moved **together**; a builder reading only its own file now learns the command exits 128 under the sandbox, that this is not its mistake, and to ask its dispatcher |
| `npm run check` | The `&&` chain became `scripts/run-checks.mjs` + `lib/check-suite.js`. **Every step runs, every failure is named**, exit still non-zero. Plus a drift guard with six negative controls |
| 64KB truncation | Closed in **six** emitters. `check-citations.mjs` was the live one — its existing `writeSync` "fix" returned a **short count without throwing** and was one `console.log` from silently failing at 289,927 bytes |
| CI wiring | The `node --test` bypass is gone; every tripwire-preloaded script now reaches CI directly or transitively |
| Sandbox | Two long-open questions closed with vendor sources; `SANDBOX.md` rewritten |
| Figures | `CLAUDE.md`/`STATUS.md` corrected, two founder decisions marked DISCHARGED with evidence, a rotted line pin removed without repinning |

---

## 3 · The finding that outlives all of it

**`npm run check` chained 30 steps with `&&` and `check:mc` sat at step 21.** A single invocation never
reached steps 22–30: `test:pre-tool-use`, `test:run-gate`, `test:tier-gate`, `test:merge-gate`,
`test:skill-clamp`, `test:sandbox`, and three probes — the safety-hook tests, **the gate's own tests**, and
the check that makes "the sandbox is armed" a fact rather than a comment.

**`qa.js`'s oracle runs `npm run check` as one command and treats it as the deterministic floor before any
reviewer is dispatched.** So the floor had a nine-step hole behind a failure that was never a real defect.
CI was unaffected because it runs each script individually — which is exactly why nobody saw it.

**Fixed at the top level, and it survives one level down.** Six `check:`/`test:` scripts are themselves `&&`
chains, 20 links (five in the suite, 18). Worst is `check:ledger`:

```
test:claims && test:classifier && test:ledger && ledger lint && ledger build --check && ledger verify
```

A `test:claims` failure silently skips `ledger lint`, `build --check` and `verify` — **the ledger's own
enforcement** — while the runner honestly reports one line. Correctly left unfixed: collapsing those links
changes what each CI job runs, and `ci.yml` names `check:ledger`, not its parts. **Cheapest high-value fix
available. Take it next.**

---

## 4 · Two defects in the gate itself

**(a) The oracle measures the wrong tree.** Gate run 1 BLOCKed reporting a `check:mc` failure that was
impossible in the tree under review — `check:mc` was not in that tree's suite at all. The oracle runs
`npm run check` wherever the dispatched agent's cwd lands (the session root), **not in the worktree holding
the ref it was handed.** Today that produced a false BLOCK, which is the safe direction. It can equally
produce a false **PASS** — a clean session root while the reviewed code is broken. **Fix before trusting
another gate run.**

**(b) Branch protection does not bind on push.** Both pushes printed
`Bypassed rule violations for refs/heads/main: 2 of 2 required status checks are expected` and succeeded
having run none. Required checks govern the PR route only. Confirmed previously on 2026-08-23 and again
twice today. **Repository setting, founder-only:** enable "do not allow bypassing", or add CODEOWNERS on
`.github/workflows/`. Until then the gate's authority is a convention, not a control.

---

## 5 · Method — the single pattern behind every defect found

**The failure is silent because the wrong answer is well-formed. A wrong path errors; a wrong tree does
not.** (pr3's phrasing, and it earned its place.)

- `EADDRINUSE` meaning a denied loopback `bind()` — `errno: 0` was the only tell; a real one is 48
- A `writeSync` "fix" returning a short count without throwing
- `"29 of 29"` dropping its own failing step out of the denominator
- `npm run check` reporting a floor it never reached
- A test asserting a **reporter's wording** (`ℹ tests 1`) rather than a fact — passes on Node 24, cannot
  pass on CI's Node 20, and turned `main` red
- A ledger A/B that wrote a historical file over the tracked one, making the worktree lie to observers for
  the duration — four runs, four windows; a reviewer's finished work was reported as unfinished from one
- The shell cwd resetting between calls: **three agents and the orchestrator**, each getting a well-formed
  answer from the wrong tree

**Operational rules that fall out, and they are cheap:** measure at the session root; use absolute paths and
re-derive state rather than carrying it; never mutate a tracked file to measure it — evaluate a copy; assert
facts, never a formatter's wording; and when you change a thing, re-derive everything that rested on it.

**Not one of these was caught by a check.** Every one was caught by an agent reading the claim against the
thing it described.

---

## 6 · Process — measured, not argued

| | Cost | Found |
|---|---|---|
| Binding gate, 49 agents | ~3.3M tokens, 32 min | 3 P1s. **Missed the handoff defect entirely** |
| 3 blinded reviewers | a small fraction | **7 P1s**, including two the gate missed |
| 1 delta reviewer | 1 agent | Cleared a 563-line post-review delta, no P1/P2 |

Two reviewers independently converged on the same zero-step bug with no coordination — a better signal than
panel size.

**The reliability finding matters more than the cost one. Nine of nine reviewers across two sessions
finished their analysis and never sent it.** One said so outright: *"analysis was complete; I failed to send
it."* A reviewer's only artifact is its message, so a silent reviewer is indistinguishable from a clean
result. At four I chased each by hand. The 49-agent run reported nine agents returning empty results and
there was no way to tell whether that mattered. **A small panel is auditable; a large one asks you to trust
a number nobody can check.**

**The founder waived the third gate run** and merged on reviewer evidence, recorded with its reasoning in
the session file. **Scoped to that branch. It does not amend rule 8.**

---

## 7 · The orchestrator's brief is still the noisiest surface

**Seven P1s today. Five were mine.** None found by a check; every one by an agent receiving my instructions.

- Recommended `sandbox.excludedCommands`, which re-opened the self-granting-permission path — after quoting
  the vendor's own reason those paths are protected. Checked it did not break the tests; did not check what
  it did to the boundary. **The gate caught it and BLOCKed.**
- Wrote a retraction warning against that change, then left *"Apply the key"* in the action list four
  sections below — the failure its own commit message said it existed to prevent.
- Reverting the key silently falsified a measurement three files depended on, and I reported the stale
  conclusion as fact.
- Read `$?` through a pipe (got the pipe's status); used `set -- $pair` under zsh, which does not
  word-split, and nearly reported three bogus merge conflicts.
- Read a peer's mid-A/B worktree and told the founder their finished work was unfinished.

**Second consecutive session with this finding, and it still has no mechanism.** Worth deciding whether it
gets one, because it is now a pattern rather than an incident.

---

## 8 · Next

1. **Fix `pre-tool-use.test.mjs:228` and get `main` green.** Red since at least 2026-08-24; a build everyone
   expects to be red is not a signal.
2. **Collapse the nested `&&` chains** (§3). Cheapest high-value fix on the board.
3. **Fix the oracle's cwd** (§4a) before trusting another gate verdict.
4. **Then the venture task — and `framer` defines it first.** Nobody has written down what Agentvibe is, who
   pays, or what the first customer-facing artifact would be. **117 session files, zero customer-facing
   work.** No playbook can run without that spec. Founder decision 2026-08-24, unchanged.

**Budgets before you write:** `DECISIONS.md` is 26 entries / 37,058 bytes against a 40,000 cap — **one entry
fits, then it needs an eviction**. `LONG-TERM.md` is 85 of 100 lines. Recompute with
`node scripts/check-memory-budget.mjs`; do not quote these.

**Founder decisions open:** branch-protection bypass (§4b); whether the orchestrator's brief gets a
mechanism (§7); the three empty-panel judge claims, deferred to 2026-11-17.

---

*Every figure here was executed. Where something was reasoned rather than measured, it says so.*
