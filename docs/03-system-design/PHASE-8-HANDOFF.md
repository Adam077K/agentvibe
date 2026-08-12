# Handoff — after Phases 6 and 7

**For:** whoever picks this up next.
**State:** Phases 1–7 complete and merged. `main` = `1647c00`. `npm run check` exits 0 from a clean clone.
**Read first:** [AGENT-SYSTEM-REBUILD.md](AGENT-SYSTEM-REBUILD.md) · [ADR-001](adr/001-claim-ledger-as-enforcement-spine.md) · [CLAIM-LEDGER.md](CLAIM-LEDGER.md)

---

## 0 · Five claims come due on the same day: 2026-09-08

This is the thing that will bite. Four waivers and one expiry land together, and a **lapsed waiver fails
harder than no disposition** — the build says so in those words.

| Claim | Scope | What it is |
|---|---|---|
| `c-shadow-window-open` | project | **The promotion decision.** Expires that day; `claim-freshness` then fails it and only a recorded disposition clears it |
| `c-read-only-binding-unverified` | project | Waived. Needs `scripts/probe-readonly-engine.sh` — one command, never run |
| `c-sessionstart-injection-unverified` | project | Waived. Needs a *new session* to observe whether `additionalContext` is honoured at SessionStart |
| `c-runtime-nested-spawn` | global | Waived. Re-probing needs subagent spawning |
| `c-rolling-five-hour-window` | global | Waived. The assumption the budget ceiling rests on |

Two of these are cheap. `probe-readonly-engine.sh` is a single command a human runs. The SessionStart one
resolves by *starting a session and looking* — if the lens and playbook content arrives, it holds.

Read the shadow window's evidence with `npm run ledger:events` before deciding promotion. Per-resolver
criteria are in [CLAIM-LEDGER.md](CLAIM-LEDGER.md) §4, including that **`claim-source` is not promotable**
because it needs the network.

---

## 1 · Where the system is

| | Before Phase 1 | Now |
|---|---|---|
| Mechanisms that can block | 1 | **12** |
| Tests, run | 0 (23 existed, unrun) | **215** |
| Agent roster | 52 files / 9,912 lines | **6 engines + 11 shims / 991 lines** |
| Skills | 147, flat manifest | **134 in 7 namespaces** |
| Skill discovery cost | ~15,000 tokens/lookup | **~1,070** |
| Scheduled jobs | **none — no clock existed** | `ledger-sweep.yml`, daily |
| `main` protected | no | yes, both checks required |

**What blocks today:** `pre-tool-use.sh` · `budget-guard.js` · `schema-lint.js` · `gate-logic.test.mjs` ·
`build-skills-manifest.mjs --check` · `check-registration.mjs` (10 checks) · `curate-skills.mjs --check` ·
`build-skill-routers.mjs --check` · `gen-codebase-map.mjs --check` · `warroom-install.test.mjs` · the six
test suites · `ledger build --check` + `verify` · `qa-lead-pass.yml`.

---

## 2 · The choice: Phase 8 or Phase 9

Both are open. They are not equally urgent.

**Phase 9 — fleet reconciliation.** Retires the 11 agent shims and reconciles `~/.claude/`, which now holds
**33 agents and 40 skills** this repo does not have. It is the only phase that touches another project, and
the debt grows on its own: 14 of 16 projects under `~/VibeCoding` carry their own agents, the globals are
live in two. Stop condition 5b says re-run the fleet baseline monthly — **`npm run warroom:fleet` is
read-only and has not been re-run since Phase 2.** Do that first regardless of which phase you pick; if
launcher generations have risen, Phase 9 moves up.

**Phase 8 — Mission Control.** The largest build in the plan and, by the plan's own words, *"the furthest
from the enforcement thesis — if Phase 8 slips, nothing upstream breaks."* Hard to justify before the spine
is proven on real work.

**The third option, and the honest one.** Stop condition 6 — *no user-facing venture work ships during the
rebuild* — is now several days old. Nothing built in Phases 1–7 has been tested against a task it did not
author. The budget guard has never blocked a real run, no playbook has executed end to end, and the lens
injection is unconfirmed. Running one genuine venture task would price the two soft spots §7 names as
unmeasured (friction cost, claim-decomposition tax) and test the thesis. That is the recommendation.

---

## 3 · What Phase 7 got wrong, because you will curate something eventually

**Nine of 37 `near_duplicate` cuts were wrong — 24%.** Every one failed identically: judged from adjacent
names rather than from reading both files.

- **Six folded into a survivor that was itself cut.** The content vanished rather than moved, which is why
  the documentation category emptied and nothing replaced it. `curate-skills.mjs` now refuses a cut whose
  named survivor is absent — **it fired six times the moment it was written**, which is the difference
  between a fix and a discovery someone makes in three months.
- **Three were sibling variants, not duplicates.** The `taste-skill` family ships minimalist / brutalist /
  premium / Stitch as *directions you choose between*. Collapsing them treated a menu as redundancy.

**Eight cases remain unresolved** — cuts that scored higher than the survivor they folded into
(`vercel-cli-with-tokens`, `parallel-agents`, `testing-patterns`, `database`, `e2e-testing`,
`llm-evaluation`, `deploy-to-vercel`, `using-git-worktrees`). They need reading, not scoring. Re-run the
screen with `node scripts/curate-skills.mjs --check` and the method in
[CURATION.yml](../../.claude/skills/CURATION.yml).

---

## 4 · Standing rules — each earned by a specific failure

The first eight are inherited; **all eight fired again across Phases 6–7.**

1. **Verify by running.** A pattern-matched count is a hypothesis.
2. **A repo-scoped search cannot see the machine.** Deleting a repo skill un-shadowed 7 globals, 5 of them
   drifted — found only because the runtime kept offering deleted skills.
3. **Test the artifact a guard produces, not just the guard.**
4. **Never assert library, syscall or precedence behaviour. Run it.**
5. **A checker's coverage is not its subject.** Fired four times: agent personas survived in `.claude/skills/`
   because Phase 4b walked `.claude/agents/`; a decorative `budget:` block survived in `war-room/` because
   schema-lint skipped it.
6. **A failure that keeps working is worse than one that stops.**
7. **Correct your own shipped claims loudly.**
8. **Every rule names a hook, CI job, resolver or data file — or it is deleted.**

**9 · Name adjacency is not evidence of duplication.** *(new)* Nine wrong cuts, made three separate times,
including once one commit after correcting it. Read both files or keep both files.

**10 · A fold is only valid if the survivor survives.** *(new)* "Kept the one carrying the most procedure" is
only true if the one kept was kept. Six chains deleted their own destination. Now enforced.

**11 · A checker that cannot fail is not a checker.** *(new)* The scheduled sweep would have been red every
day — a fresh runner has no run log — until the invariant was made symmetric: never pass what you could not
check, and **never fail it either**.

---

## 5 · Traps specific to whatever comes next

- **`ledger events` mixes history with current state.** It reports the last event per claim, including
  failures fixed weeks ago. `ledger sweep` reads current resolver state for exactly this reason.
- **A budget event is not an artifact.** `lastArtifactAt` originally used the event log's mtime — and the
  guard appends to that log, so every budget line reset the stall clock it measures. Fixed; the shape is
  worth remembering.
- **`schema-lint.js` still fails open on the skills manifest** — `catch { LIVE_SKILLS = null }` silently
  disables its own check. `check-registration.mjs` covers that case; the shape is still in the file.
- **Delegation is a brief problem, not a plumbing problem.** Round one of research agents returned nothing
  and the reply channel was blamed. Round two returned quotable mechanisms through the *same* channel. The
  difference was a named test with worked pass/fail examples and a required output format. Writing findings
  to disk did not help; the brief did.
- **The 803 external skill candidates were never evaluated.** No claim of "best in the world" is made
  anywhere — `c-external-skill-corpora-not-evaluated` pins that.

### How the Phase 6 handoff scored

Its §0 said three mechanisms had no consumer. All three were resolved: the reader became `ledger sweep`, and
lenses and playbooks are now injected at session start. Its gate had **three criteria amended**, each with
the measurement that forced it — a dispatch-gated budget would never have fired once in 1,314 turns, and
`DECISIONS.md` cannot be a ledger view because the schema has no field for a rejected option.

---

## 6 · How to work

```bash
git checkout -b feat/<slug> origin/main
npm run check          # must exit 0 before you push — the same checks CI runs
npm run ledger:sweep   # expiry, lapsed waivers, dead resolvers
npm run ledger:events  # what the shadow window has actually recorded
npm run warroom:fleet  # read-only; stop condition 5b wants this monthly
gh pr create --base main
# label risk:irreversible for .claude/**, .github/workflows/**, scripts/lib/** or migrations
# session file required: docs/08-agents_work/sessions/YYYY-MM-DD-<role>-<branch-slug>.md
#   frontmatter needs qa_verdict: PASS — the gate BLOCKS, and main is protected
```

Mark every figure **VERIFIED** or **ESTIMATED**.

---

*Handoff written by: ceo · 2026-08-12 · `main` = `1647c00`*
