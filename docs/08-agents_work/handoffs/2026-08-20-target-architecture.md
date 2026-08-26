> **HISTORICAL — superseded by [docs/STATUS.md](../../STATUS.md).** Retained for the record.
> Read STATUS.md for current state; nothing here is a live instruction.

# Handoff — build the target architecture

**From:** ceo (`ceo-2-1787176362`) · **Date:** 2026-08-20 · **Base:** `main` = `1f5e742`

> **The plan is written. You build it.** [TARGET-ARCHITECTURE.md](../../03-system-design/TARGET-ARCHITECTURE.md)
> holds 13 founder decisions, 12 surfaces and a sequence P0 → P6. This document says what to do first, what
> will bite you, and what nobody has done yet.

---

## 0 · The one thing to understand first

**In this repository, reading is not a verification method.**

House style preserves superseded statements beside their corrections. That is right for history and it makes
prose an unreliable oracle: **a fix comment and a live bug are indistinguishable to `grep`.**

Two orchestrator lanes produced **twelve false findings** across this round and the audit round. **Every one
died to running a command. None died to re-reading.** Five were the author's own — including one relayed to
the founder as the most alarming item in the system, which turned out to be a comment describing a defect
fixed five days earlier, and one "six-line fix" recommended twice that could not work at all.

**Execute before you assert. Mark every finding VERIFIED-BY-EXECUTION or READ-ONLY.** The warning does not
immunise you; only re-running does. Both orchestrators fell into it *while relaying the warning*.

---

## 1 · Start here — P0.5, not P0

**Provenance that travels.** Not the gate. The reason is a dependency, not a preference:

P0 adds `judged_by` and attestation records **into the very files whose citations cannot leave this
repository**. Fix provenance to a content hash first and everything P0 adds is born portable; do the gate
first and P0 spends a week making P1 more expensive.

The blocker, verified by execution:

```
~/bin/newproject:125   rsync -a --exclude='.git'
             :134      rm -rf "$PROJECT_DIR/.git"
             :180      git init --quiet          ← empty object store
```

26 `sources:` citations across `lenses.yml` and `review-lenses.yml` name blobs from two revs that exist only
here. `schema-lint.js:1176` gates on `git cat-file -e` and **hard-fails** — verified by hiding the object
store: `18 pass · 2 fail`, exit 1. `fetch-depth: 0` is inert; you cannot fetch an object that never existed.

Fix provenance with a content hash plus vendored source text. **And fix `schema-lint.js:1179`'s message** —
it currently tells the operator to set a flag that cannot help in this case.

---

## 2 · The gate — P0, and it is two fixes, not one

Both are required. **Neither covers the other's route.**

| Route to `main` | Intercepted today | Needs |
|---|---|---|
| GitHub PR | Partially — `qa-lead-pass.yml:124` greps a verdict **the author committed** | CI-signed check-run; delete the grep |
| `warroom merge <N>` | **No.** Verified: the only `origin` reference in all 133 lines is `git fetch origin main`. **There is no `git push`** — it merges into *local* `main`, so CI never runs and **branch protection cannot reach it** | `run-gate --require` + a verdict record matching the diff |

**Do not reuse the author's plan for fix 1.** An earlier draft said "insert `run-gate --require`, ~6 lines,
highest leverage in the system." It was wrong. `run-gate.mjs`'s own header states **it cannot execute
`qa.js`**, and `--require` *exits 1 when the gate IS required* — so that fix refuses every irreversible merge
unreviewed and waves through every lite one. It also fails open on the default ref (`EXIT=0`, "Nothing to
gate"). `bin/warroom` is bash; there is no bash path to the Workflow runtime.

The verdict anchor that works: `subject = sha256(git diff $(git merge-base origin/main HEAD)..HEAD -- .
':(exclude).qa/verdicts/**')`. PR #77 keyed to a HEAD SHA that stops existing the moment the record is
committed; the primitive was right and the anchor was wrong.

Also in this PR: `branch -D` → `branch -d` (three sites — force-delete destroys the record of what was
merged), and the fake `tier=fast-forward` string, which puts a merge *strategy* in a field named for a risk
*tier*.

---

## 3 · What is true, so you do not re-derive it

- **Roster is settled and enforced.** 7 engines + 11 shims; `schema-lint.js:59` + `checkEngineRoster()` fail
  a build in both directions. `framer` **survives** — founder decision 2026-08-16, recorded in
  `schema-lint.js:753-761`; deleting it also orphans the `product` lens. The "three contradictory
  definitions" are stale prose, not live policy.
- **`operator` / `instrument` stay uncreated.** The sandbox armed **filesystem only** — there is no `network`
  block, and `sandbox-config.test.mjs:140` asserts `network.allowedDomains` must not be set without founder
  input. Egress is withheld *and tested for its absence*. Founder decision 11 now authorises adding it.
- **The designer's perception loop works** — verified live: 24 playwright tools, a navigate and a screenshot.
  Issue #90 is non-determinism, not breakage. But `design.js`'s `VARIATION_SCHEMA` admits only prose, so the
  one workflow that dispatches `designer` **cannot use the loop**. Add a `rendered_evidence` field.
- **`reviewer` holds `Bash`** and a probe wrote a file. Drop the shell and serialise the diff into its
  prompt, as `qa.js` already does for the judge. Note `probe-readonly-engine.sh`'s failure text misdiagnoses
  its own finding — the `tools:` field binds exactly as declared; **the defect is the grant.**
- **Playbooks are read by nothing at runtime.** The only references build an index. Three of six are
  referenced by zero commands. **Exit-criterion names are unvalidated free text** — proved by swapping one
  for `criterion(vibes-are-good-trust-me)`: 18 pass · 0 fail. Two of four `GATES` are strings with no
  implementation, and **nothing deploys** (`grep -ci "vercel|deploy" .claude/settings.json` → 0).
- **The template cannot instantiate.** `init-from-template.sh` runs 21 substitutions against **one**
  surviving placeholder, because `CLAUDE.md` was correctly filled in and no pristine copy was kept. Every
  generated project inherits a Project State describing PR #47.

---

## 4 · Traps — each of these cost real time

1. **`bun install --frozen-lockfile` in `mission-control/` before any measurement**, or `ledger verify` reads
   8 would_block instead of 5. This has produced wrong readings five times.
2. **`check-registration.test.mjs:93,115` writes into the live tracked `pre-tool-use.sh`** and restores in a
   `finally`. A Ctrl-C mid-test leaves the **security hook** modified on disk. Four sibling checks use
   `mkdtemp`; only this one touches the repo. Fix it before you interrupt a test run.
3. **Do not "clean up" the 688 `budget.block` rows.** 682 are fixtures; **13 are real** — eight stall blocks
   and five window blocks at 4,991,457 against a 3,000,000 ceiling. They are the only real budget evidence in
   the repo.
4. **Do not "fix" the `qa.js` verifier priming.** It was fixed in PR #42; the live panel is refute /
   reproduce / steelman. `MODEL-DIVERSITY.md` still describes the *pre*-fix code in the present tense with
   line numbers off by 100 — **two independent agents asserted the same false P0 from it in one session.**
   Correct that document in whichever PR touches the gate.
5. **A subagent that goes idle has not necessarily finished.** Measured across 23 agents: **2 of 13 delivered
   without an explicit transmit instruction; 10 of 10 delivered with one.** Put *"Send via SendMessage to
   main. Do not end your turn without sending it"* in every brief. At corpus scale, 1,298 subagent
   transcripts end mid-tool against 794 ending cleanly, and **there is no `stop_reason` for a `maxTurns`
   cut** — the cap binds silently.
6. **A skill's `allowed-tools` SUBTRACTS.** `impeccable` — the skill the roster spec assigns to `designer` —
   would clamp it out of its own perception loop. Strip the field from the skill before the migration.
7. **Three agentTypes already resolve to nothing.** `design-screen.md` is `.md`, so
   `check-dispatch-agenttype.mjs` (which parses only `*.js`) never sees it; `product-designer`,
   `design-critic` and `design-polisher` are absent from the repo *and* the global dir, falling back to
   `general-purpose` with tools `*`. Close this **before** retiring any shim.

---

## 5 · One item is a date, not a plan item

**The shadow-to-blocking promotion review falls 2026-09-08.**

Measured: **9,790 `claim.would_block` events over nine days, 42 claims, four artifacts — 100% harness
self-description, and 36% of the corpus is one deliberate canary firing.** Promotion on that corpus
calibrates against a workload sharing no properties with the one it will govern.

The founder declined the cheapest hedge (one real sourced claim this week) and kept the sequence — recorded
in §9.6 with its cost. **That decision does not move the date.** Someone has to decide whether the promotion
happens on this corpus, and it is not a build-order question.

---

## 6 · Baselines — measure against these

```
node scripts/check-registration.mjs        ✓  18 agents · 134 skills · 7 warnings
node scripts/check-memory-budget.mjs       ✓  DECISIONS.md 39,909 / 40,000  ← 91 bytes
node scripts/ledger.mjs lint               ✓  clean
node .claude/hooks/schema-lint.js          ✓  18 pass · 0 fail · 0 warnings
node .claude/hooks/session-start.js | wc -c   2941  (budget 4096)
```

**`DECISIONS.md` has 91 bytes of headroom.** The entry cap (50) sits at 46% and will never bind; CLAUDE.md
tells every agent it has "≤50 entries" of room. **Fix the sentence in the same PR as the mechanism**, or the
next author walks into a red build holding a wrong model.

**Nobody has measured whether this repo is green right now.** Every estimate in the plan assumes a clean
baseline that was never established. Establishing it is a reasonable first act.

---

## 7 · What nobody has done

**The walk from "I have an idea" to "shipped" reaches step one and stops.** It was finally attempted this
round and it stops on the template, not on anything anyone predicted. Beyond that: no deploy path exists, and
a founder's *first ordinary feature* — a table to hold emails — classifies `irreversible`, which is 2-of-3
multi-judge plus founder sign-off. **There is no ordinary-day path.**

**And nothing in this system has ever been read by anyone who did not write it.** Every reviewer, judge and
lens across 26 agents was the same model family reading the same repo. The `claim-judge-external` resolver in
P0 is the first thing that changes that — which is a better argument for it than the gate.

---

*Written by ceo (`ceo-2-1787176362`), 2026-08-20. Every figure marked verified was executed. Where something
was not measured, it says so.*
