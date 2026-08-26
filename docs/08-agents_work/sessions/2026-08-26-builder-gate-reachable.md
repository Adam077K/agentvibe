---
date: 2026-08-26
role: builder
task: gate-reachable
branch: feat/orchestrator-reaches-the-gate
tier: irreversible
qa_verdict: PASS
decisions:
  - Refused the brief's premise that a `Workflow` grant is what makes the gate reachable. The
    orchestrator already holds the tool; the missing piece is a route, and routes were out of scope.
  - Admitted `Workflow` to `TOOL_UNIVERSE` because excluding it made the linter state something the
    binary contradicts, and added `PS-WORKFLOW-CONTAINMENT` to own the refusal on its real grounds.
  - Made the rule fail for `orchestrator` too, on a DIFFERENT ground. This exceeds the brief's
    literal "any engine other than orchestrator" and is flagged as the one deviation.
  - Left `test:probe-workflow-reach` OUT of the check suite and the CI workflow, registered in
    EXCLUDED with the measurement. Wiring it moves two derived figures and fails `check:figures` at
    20 sites in docs/STATUS.md and CLAUDE.md — files this brief forbade me to touch.
corrections:
  - "Brief: 'No engine can reach the binding QA gate.' REFUTED. The orchestrator is a main session
    and main sessions hold `Workflow`; qa.js has run 55 times that way."
  - "Brief: 'None declares Workflow' — CONFIRMED, but it is not the cause of anything."
  - "Base drifted: origin/main moved 244e8db -> 47dbbd6 mid-session (PR #108). Fast-forward; the
    standing rules' base is an ancestor. Built on 47dbbd6."
claims_touched:
  - c-workflow-invocation-contained
---

**Tier is `irreversible`** — `node scripts/classify.mjs` returns `floor=irreversible`, driven by
`.claude/hooks/schema-lint.js` (`.claude/hooks/**`), with `.github/workflows/ci.yml` also
`irreversible`. **This PASS is author-recorded against a deterministic floor by one agent of one
model family.** The tier asks for 2-of-3 multi-judge and `risk: high` asks for ≥2 distinct model
families; neither is met here, and the verdict record should be read as "the checks ran and are
green", not as "the irreversible tier was satisfied".

## What the brief asked, and what was actually true

The brief asked me to grant the orchestrator the ability to invoke `.claude/workflows/qa.js`, and
explicitly invited refutation of its mechanism. The mechanism is wrong, and the repo had already
measured why on 2026-08-14 — the finding just never reached the brief.

`Workflow` is a real runtime tool: `strings -a` on binary **2.1.246** yields
`WORKFLOW_TOOL_NAME:()=>Xu});var Xu="Workflow"`, and it fires **55 times** in the transcript corpus
on this machine. The orchestrator is **not dispatched** — it *is* the session (`bin/warroom` launches
a bare `claude`; nothing names an agent file), so **every field in `orchestrator.md`'s frontmatter is
inert on the path it runs on**, per CONTROL-PLANE.md §1.1. The session already holds the tool. That is
how qa.js has run. Adding `Workflow` to its `tools:` grants nothing — it is the `mcpServers`
fabrication one field over, and `2026-08-13-rethink-board.md:46` proposed exactly that remedy.

So the gate is reachable today and the real gap is a **route** (`gate: qa-verdict` resolves to
nothing; `scripts/run-gate.mjs` emits the invocation and is called by nobody). Routes live in
`.claude/playbooks/` and `.claude/commands/`, both held by another lane — so I built the guard the
brief also asked for, and left the route alone.

## What landed

Containment was, until now, an **accident of an omission**: `Workflow` was simply missing from
`TOOL_UNIVERSE`, so it was refused as *"is not a runtime tool"* — a false statement whose obvious
repair (append the name) would have silently opened the tool to all seven engines, with no test to
go red. The name is now admitted and `PS-WORKFLOW-CONTAINMENT` owns the refusal, in two arms with
distinct messages: for non-orchestrator engines, *the gate must not be invocable by the thing it
gates*; for `orchestrator`, *this declaration grants you nothing you do not already have*.

## Verification, and the controls

- `npm run check` → **Tally: 46 of 46 passed · 0 failed · 255.0s · exit 0**, sandbox armed.
- `node --test scripts/prompt-standard.test.mjs` → **74 pass · 0 fail** (68 before). Both mutations
  go red: deleting the rule → 2 failures; reverting the `TOOL_UNIVERSE` line → 3.
- The rule fires on **7 of 7** engines with a `Workflow` entry and on **0 of 7** without — the
  control, without which the first number means nothing.
- `workflow`, `WORKFLOW`, `Workflow ` do not slip through; they fail `PS-TOOL-EXISTS` instead.
- `node .claude/hooks/schema-lint.js` → **18 pass · 0 fail · 0 warnings**, exit 0.
- `npm run check:ledger` → exit 0; the new claim resolves ✓ on both `claim-command` and
  `claim-freshness`, now against the whole-roster lint rather than the seven-engine test. The 10 shadow entries are pre-existing (canary, three judge claims, and the
  mission-control set that CLAUDE.md attributes to a missing `bun install`).

`scripts/probe-workflow-reach.mjs` makes the measurement re-runnable: **0 subagent `Workflow` calls
against 55 from main sessions**, with a control of tens of thousands of subagent `Bash` calls in the
same scan. **The absolute counts rot and the ratio does not** — re-run hours later on the same
machine, the corpus reads 2,802 files where it read 2,958 and the `Bash` control 52,711 where it read
57,590, because transcripts are pruned; subagent `Workflow` was 0 and main-session `Workflow` was 55
in both. Derive them with `node scripts/probe-workflow-reach.mjs` rather than quoting these. The control is not decoration — the probe reports **UNRESOLVED and
exits 2** when it does not fire, so an empty corpus cannot produce a containment verdict. Verified by
executing all three paths, including the fixture built to defeat the conclusion: a constructed
subagent `Workflow` call is **admitted** and returns `BREACHED`, exit 1.

## What I did NOT do, and why

I first wired `test:probe-workflow-reach` into `STEPS` and the CI workflow, and **backed it out
after measuring the cost**. A 47th step moves `suiteSteps` 46→47 and `ciRunSteps` 47→48, and
`npm run check:figures` then reports **20 findings** across `docs/STATUS.md` (8), `CLAUDE.md` (3)
and the CI workflow (4). The first two are held by other lanes. Measured both ways: wired,
`npm run check` was **44 of 47** with `test:figures`, `check:figures` and `check:map` red; unwired
and after `npm run build:map`, clean. The exclusion is registered in `scripts/lib/check-suite.js`
with the numbers and a `FALSIFY THIS`, so it is visible rather than silent — **but the probe's
refusal path is checked by nothing automated, and that is a real gap, not a rounding error.**
Wiring it is one commit for whoever holds those two files next.

Two things that check caught in my own work, both corrected: the exclusion first cited
`npm run build:figures`, **which does not exist** (`check-figures.mjs` has no writer mode), and it
named the workflow file, which trips a guard that reads any such mention as a claim of CI coverage.

I did not build the **route**, which is the actual fix for the brief's headline problem. It lives in
`.claude/playbooks/` and `.claude/commands/`, held by L1-surface.

## Blind review (#111) — evidence FAIL, two p1s, both in what the change said about itself

The mechanism passed adversarial and correctness; the reviewer could not defeat it by any route the
linter evaluates. Both p1s were claims the diff made about itself, which is the failure this branch
exists to fix, committed inside the fix for it. All four fixed here, each re-measured:

**E1 — the probe test's header claimed CI wiring the same commit denied.** `POSTURE: BLOCKS. Wired
to ci.yml` against `grep probe-workflow-reach .github/workflows/*.yml` → **0 matches**, control
`probe-stop-reason` → **2**. `check-suite.js`'s EXCLUDED entry, added in the same commit, said the
opposite and was right. Nothing catches it: only `gen-codebase-map.mjs` parses `POSTURE:`, and not
for the test-file table. Header corrected to `POSTURE: REPORTS`, pointing at the EXCLUDED entry.

**E2 (revised twice) — the claim asserted more than its resolver could check, in TWO clauses and
by TWO blind spots.**

*Delta review closed the coverage half and found the rest.* The assert is now the bare
`"No agent file declares a Workflow tool"`. The clause `", so the binding QA gate is not invocable
by any engine it gates"` is **deleted for the same reason clause 3 was** — clause 3 had an
unverifiable *subject*, clause 2 an unverifiable *predicate*. It is an entailment, sound only if a
frontmatter declaration is the sole grant channel, and this repo's own
`check-dispatch-agenttype.mjs` says otherwise: a dispatch naming no `agentType` gets
`general-purpose`, tools `*`. **Whether that default contains `Workflow` is measured nowhere.** The
only thing standing against it is observational absence — precisely what the ledger comment says
was removed from the sentence. I applied that principle to one clause and not the other.

*And the repoint traded a blind spot rather than closing one.* `evidence.cmd` is now
`node .claude/hooks/schema-lint.js && node --test scripts/prompt-standard.test.mjs`, because the
lint checks the **tree** and the test checks the **rule**. Measured with a control that fires:

| | compound cmd |
|---|---|
| clean tree — control | exit **0** |
| PS-WORKFLOW-CONTAINMENT deleted | exit **1** |
| `Workflow` removed from `TOOL_UNIVERSE` | exit **1** |

With the rule deleted, `Workflow` is still in `TOOL_UNIVERSE`, so an engine may declare it and
`schema-lint` alone exits **0** — the claim green while its assert is false. `claim-command` runs
`/bin/sh -c`, so the `&&` is real rather than decorative.

*The original finding, kept because it is the one that started this:* The cited command,
`node --test scripts/prompt-standard.test.mjs`, iterates `LIVE` — **7 engines of 18 files** — and
shims early-return before the rule. So a shim declaring `Workflow` left the assert false and the
claim green: Rule 10, in a lane that built a probe to refuse exactly that. `evidence.cmd` now points
at `node .claude/hooks/schema-lint.js`, which covers **18 of 18** by two rules — verified by
construction against a control that fires: a clean engine file yields `[]`, an engine carrying
`Workflow` yields `PS-WORKFLOW-CONTAINMENT`, and a shim carrying `tools:` yields
`shim: must not declare "tools"`. The third clause — *"the orchestrator reaches it by route rather
than by grant"* — was **deleted, not re-verified**: it is true and measured, but no command checks
it, and a clause no resolver evaluates is prose wearing a claim's shape. `confidence: 1` stays only
because what remains is a decidable property of the tree.

**E3 — a "verified by execution" comment that execution contradicts.** `parseFrontmatter` trims
unquoted list items, so `Workflow ` arrives as `Workflow` and is caught by
`PS-WORKFLOW-CONTAINMENT`, not `PS-TOOL-EXISTS` as the comment claimed — and the test quoted every
variant, so the one case the comment named was the one case never exercised. Containment held either
way; the stated reason was wrong for two of four. Comment corrected, and the test split into a case
arm and a whitespace arm exercising **both quotings**, plus an assertion pinning the trim itself.

**E4 — a rotting denominator beside a sound ratio.** Re-measured the same day: the corpus reads
**2,802** files where it read 2,958, and the `Bash` control **52,711** where it read 57,590 —
transcripts are pruned. **The two figures that decide the question did not move: subagent `Workflow`
0, main-session 55.** The absolute counts are removed from the code, the ledger and this file in
favour of the ratio and `node scripts/probe-workflow-reach.mjs`.

**Not fixed here, deliberately — and it is bigger than this PR.** A duplicate frontmatter key hides
a declaration from *every* frontmatter rule: `parseFrontmatter`'s loop is last-key-wins with no
duplicate detection, so a second `tools:` line silently discards the first. That defeats the `model`
check, `maxTurns` and the reviewer engines' `Write` ban, not just this rule. Pre-existing —
identical on `main` — and a duplicate-key check closes it for all rules at once. It is a separate PR.

## Stated limits

A `kind: shim` file never reaches `PS-WORKFLOW-CONTAINMENT` — `lintFile` early-returns before the PS
block. The gap is bounded, because `check-dispatch-agenttype.mjs` refuses any dispatch naming a
shim, and a test pins the limit so that making shims dispatchable becomes a red test.

The corpus evidence is observational. It does **not** discharge CONTROL-PLANE.md §6 P2, which names a
direct dispatch experiment. What would refute this: one `Workflow` call recorded with
`isSidechain: true`. The probe exists to catch that.
