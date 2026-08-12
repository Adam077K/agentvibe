# Phase 6 Handoff — reader, budgets, stall detection, routines

**For:** the team executing Phase 6.
**State at handoff:** Phases 1–5 complete and merged. `main` = `6e0c24b`. `npm run check` exits 0.
**Read first:** [AGENT-SYSTEM-REBUILD.md](AGENT-SYSTEM-REBUILD.md) · [ADR-001](adr/001-claim-ledger-as-enforcement-spine.md) · [CLAIM-LEDGER.md](CLAIM-LEDGER.md)

---

## 0 · Start here: three mechanisms shipped with nothing invoking them

Stop condition 7 is *"a new mechanism is added that nothing invokes within two weeks"* — the condition written
to catch this plan's own worst failure mode, building mechanisms because they are satisfying to build.

Measured on the day of this handoff:

| Mechanism | Mechanical consumer |
|---|---|
| Claim ledger | ✅ `ci.yml` runs `ledger verify` on every PR |
| Classifier | ✅ `qa-lead-pass.yml` calls `classify.mjs` |
| **Lenses** | ❌ linted only — nothing loads them at runtime |
| **Playbooks** | ❌ linted only — nothing executes them |
| **`reader` engine** | ❌ **nothing invokes it at all** |

The `reader` engine is the sharpest case: Phase 4b created the file, and its own body says it exists because
a run log with no reader is a reason to stop building. **Its two-week clock started 2026-08-11.** Wiring it
is Phase 6's first job, not its last.

The lens and playbook cases are softer — an agent reads them when it runs — but "an agent will read it" is
the same promise that 6,487 lines of agent prose made before it rotted. Phase 6 should decide what
*mechanically* consumes them, or say plainly that nothing does.

---

## 1 · Where the system actually is

Measured, not claimed.

| | Before Phase 1 | Now |
|---|---|---|
| Mechanisms that can block | 1 | **9** |
| Tests, run | 0 (23 existed, unrun) | **155** |
| Agent roster | 26 files / 6,487 lines | **6 engines + 11 shims / 1,099** ⚠ see correction |
| Slash-command prose | 891 lines | **690, and invocations rather than descriptions** |
| Tracked files | 2,290 | 675 |
| `main` protected | no | **yes — both checks required, admins exempt** |

> **CORRECTION, 2026-08-12 — the roster figure above was misleading and I wrote it.**
> "26 files / 6,487 lines → 7 engines + 11 shims / 1,099 lines" is true of `.claude/agents/` and reads as a
> statement about the roster. Measured: `.claude/agents/war-room/` holds **3,256 further lines across 25
> files**, so the real roster is **4,355 lines across 42 files**. The original Phase 4 scope was all 52 files /
> 9,912 lines; war-room was deferred to Phase 6 by plan, so the collapse is **55% done, not 83%**. It sat
> outside every count because `schema-lint.js` deliberately does not walk that directory — which is also why
> a decorative `budget:` block survived there through the phase that deleted 44 decorative `mcpServers`.
> A checker's coverage is not its subject, again.

**What blocks today:** `pre-tool-use.sh` (`exit 2`) · `schema-lint.js` (agents, lenses, playbooks, shims) ·
`gate-logic.test.mjs` · `build-skills-manifest.mjs --check` · `check-registration.mjs` ·
`warroom-install.test.mjs` · `claims/classifier/ledger/lenses/playbooks` test suites ·
`ledger build --check` · `qa-lead-pass.yml`.

**What runs in shadow:** every claim resolver, except on migration / deploy / harness-self-edit paths.
**The promotion decision is due 2026-09-08** and books itself — see §5.

---

## 2 · What Phase 6 must build

Per [AGENT-SYSTEM-REBUILD.md §3.8](AGENT-SYSTEM-REBUILD.md) and the phase table:

1. **Wire the `reader`.** It is a file with no caller. Give it a schedule and a destination for its output.
2. **Budgets.** A ceiling that fires **before** dispatch with a named reason — not a post-hoc report that the
   run was expensive.
3. **Stall detection.** A stalled run escalates instead of looping. Stop condition 3 (>200k tokens, no
   structured output) needs this to be checkable at all.
4. **Routines, cut to three classes.** 25 war-room routines exist; **24 of the 25 call services this repo has
   no configuration for.** Rebuild ~3, delete the rest. §3.8 names the classes: `clock` (2/day),
   `harness-health` (`reader`, `claim-refresh`, `fleet-drift`), `value` (~3).
5. **The memory-file collapse.** `DECISIONS.md`, `LONG-TERM.md`, `USER-INSIGHTS.md` and `CODEBASE-MAP.md`
   become generated views over the ledger. **Assigned to Phase 6 deliberately** — it was deferred out of
   Phase 3 because it is a data migration over files holding real founder memory.

### The gate to proceed

> A stalled run escalates instead of looping · the ceiling fires **before** dispatch with a named reason · a
> stale reader stamp warns at session start · the four memory files are generated views, **with the migration
> proven non-lossy against the pre-migration files**.

Add one, given §0: **every mechanism shipped in Phases 3–5 either has a named mechanical consumer or is
recorded as having none.** A mechanism nobody invokes is not neutral; it is cost with the appearance of
coverage.

---

## 3 · Assets to reuse — verified this session, not inherited

| Asset | State | Use for |
|---|---|---|
| `scripts/ledger.mjs` | `build` · `rebuild` · `lint` · `verify` · `judge` · `events` · `views` | `events` is the run-log reader; `views` is the rendering the memory collapse needs |
| `scripts/lib/claims.js` | Strict parser, closed schema, dispositions | The one YAML parser. Do not add a second |
| `scripts/lib/classifier.js` | The only risk implementation; 17 tests | Budgets and stall thresholds should key off the same tiers |
| `scripts/lib/resolvers.js` | 4 resolvers, 47 tests | `unresolved` is never `pass` — keep that invariant |
| `.claude/hooks/schema-lint.js` | Lints agents, shims, lenses, playbooks | Extend it. It is the one linter |
| `~/.<session>/events.jsonl` | Live; written by the launcher and the ledger | Where budgets and stalls should log |
| `.claude/agents/reader.md` | Written, **never invoked** | Phase 6 deliverable #1 |

**Re-verify any row before relying on it.** Two rows of the Phase 3 handoff's own assets table were stale
within one phase.

---

## 4 · Standing rules — each earned by a specific failure

The first four are inherited and all four fired again this session.

**1 · Verify by running. A pattern-matched count is a hypothesis.**
The founding diagnostic asserted 16 fabrications; 6 were not, and 7 of its numbers were wrong.

**2 · A repo-scoped search cannot see the machine.**
Phase 1 deleted `_seeds/` as "zero references"; 8 of 12 launchers read it at startup. In Phase 4b the same
shape nearly shipped again: deleting a repo agent does not remove the name, it **un-shadows** the drifted copy
in `~/.claude/agents/`.

**3 · Test the artifact a guard produces, not just the guard.**
Six install guards passed a manual pass; a backup still shipped non-executable.

**4 · Never assert library, syscall or precedence behaviour. Run it.**
"`copyFileSync` keeps the destination's mode" — false on macOS, and it broke the founder's launcher.

**5 · A checker's coverage is not its subject.**
`check-registration.mjs` verified every *path* named in a governing doc, and Phase 1 declared "fabrications =
0". Nobody had written the equivalent for *names*: `/ship`, `/daily` and `/debug` assigned work to five agents
that never existed here. Ask what shape of lie your checker cannot see.

**6 · A failure that keeps working is worse than one that stops.**
`@ceo` after a naive Phase 4b would not have errored. It would have run a 313-line Sonnet definition routing
to four retired agents. Prefer loud breakage; where you cannot have it, occupy the name deliberately.

**7 · Correct your own shipped claims loudly.**
Phase 4a shipped "these are the only copy in every other project" — inferred, and false. It was corrected
inside the fabrication catcher itself. A wrong claim in the thing that catches wrong claims is the worst place
for one.

**8 · Every rule names a hook, CI job, resolver, or data file — or it is deleted.**
See CLAUDE.md § Rules: 10 rules, each marked `ENFORCED`, `SHADOW` or `ADVISORY` with the phase that will give
it a mechanism.

---

## 5 · Traps specific to Phase 6

- **The promotion decision is due 2026-09-08 and books itself.** `c-shadow-window-open` expires that day;
  `claim-freshness` then fails it and the only way to clear it is a recorded disposition. Read the evidence
  with `npm run ledger:events`. Per-resolver criteria are in [CLAIM-LEDGER.md](CLAIM-LEDGER.md) §4 — including
  that **`claim-source` is not promotable**, because it needs the network.
- **A lapsed waiver fails harder than no disposition.** Two are live and both expire 2026-09-08:
  `c-runtime-nested-spawn` and `c-read-only-binding-unverified`. Let them lapse and the build tells you so in
  those words.
- **`scripts/probe-readonly-engine.sh` has never been run.** Phase 4's third gate criterion is
  declaration-verified only. It needs a human and one command.
- **The memory migration is lossy by default.** `ledger views` renders; it does not preserve what those four
  files hold that is not a claim. Prove non-lossy against the pre-migration files, or the gate is not met.
- **Budgets that report are not budgets.** The criterion says the ceiling fires *before* dispatch with a named
  reason. A post-hoc cost summary satisfies nothing.
- **`schema-lint.js` still fails open on the skills manifest** — `catch { LIVE_SKILLS = null }` silently
  disables its own skill check. `check-registration.mjs` covers that specific case; the shape is still in the
  file and should not be copied.

### How the Phase 3 handoff scored

Worth knowing, because this document will be graded the same way: **three of its five traps fired.** The
`schema-lint` fail-open shape recurred, `judge` resolvers did inherit their tier limit (it does not call a
model at all), and the claim-decomposition tax is still unmeasured. Two did not: self-review has held so far,
and the 44 decorative `mcpServers` were deleted rather than becoming 44 false claims.

---

## 6 · Open items inherited

| Item | Owner | Notes |
|---|---|---|
| Wire the `reader` — nothing invokes it | **Phase 6** | Stop condition 7 clock started 2026-08-11 |
| Decide what mechanically consumes lenses and playbooks | **Phase 6** | Or record that nothing does |
| Memory files → generated views, proven non-lossy | **Phase 6** | Assigned deliberately, not deferred again |
| 25 war-room routines; 24 call unconfigured services | **Phase 6** | Cut to ~3 |
| Shadow-window promotion decision | 2026-09-08 | Books itself via `c-shadow-window-open` |
| Run `probe-readonly-engine.sh` | founder | One command; closes Phase 4's third criterion |
| 11 shims retire | **Phase 9** | They exist only to stop the globals taking their names |
| 33 agents exist only in `~/.claude/agents/` | **Phase 9** | Absent from a fresh clone; includes the 13 `seo-*` |
| Skills curation (~70 of 803) | **Phase 7** | Parallelisable with 6 |
| Mission Control | **Phase 8** | Largest build, furthest from the thesis |
| Fleet rollout to 11 remaining launchers | **Phase 9** | No other project written to before then |
| Monthly: re-run the fleet baseline | ongoing | Stop condition 5b — if generations rise, deferring costs more than assumed |
| Zero user-facing venture work has shipped during the rebuild | **founder** | Stop condition 6. Not firing yet; it is one day old |

---

## 7 · How to work

```bash
git checkout -b feat/phase-6-<slug> origin/main
npm run check          # must exit 0 before you push — the same checks CI runs
npm run ledger:events  # what the shadow window has actually recorded
gh pr create --base main
# label risk:irreversible when touching .claude/**, .github/workflows/**, scripts/lib/** or migrations
# session file required: docs/08-agents_work/sessions/YYYY-MM-DD-<role>-<branch-slug>.md
#   frontmatter needs qa_verdict: PASS — the gate BLOCKS on it now, and main is protected
```

Mark every figure **VERIFIED** or **ESTIMATED**.

**Stop at the end of Phase 6.** Do not start Phase 7.

---

*Handoff written by: ceo · 2026-08-11 · `main` = `6e0c24b`*
