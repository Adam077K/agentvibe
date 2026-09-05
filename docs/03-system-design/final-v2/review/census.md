# Census of FINAL-PLAN-v2.md · reviewer lane · 2026-09-05

**Summary — path classes (261 backticked path-like tokens, 69 repo-checkable on this branch):**

| Class | Count |
|---|---|
| EXISTS-as-claimed | 57 |
| ABSENT-and-marked | 12 |
| **ABSENT-not-marked (defect)** | **2** |
| WRONG-BRANCH | 0 |
| **TREE-NAME-ONLY (`keel/…`)** | **23 distinct paths** |
| Design paths under `bin/` that are real files | 3 |
| Not repo paths (slash commands, org/model handles, `~/` vendor paths, bare filenames) | ~192 |

**Measurements: 27 MATCH · 2 DRIFT · 2 UNMEASURABLE-HERE.**

## Defect table

| Path | Line · section | Class | What disk says |
|---|---|---|---|
| `../COVERAGE.md` | 6216, §23 | **ABSENT-not-marked** | Link target resolves to `docs/03-system-design/COVERAGE.md` — **does not exist**. The file is `docs/03-system-design/final-v2/COVERAGE.md`, a sibling. The prose one clause earlier says *"beside this document"*, so `../` contradicts the sentence carrying it. |
| `final-v2/page/` | 27, header `companions:` | **ABSENT-not-marked** | Directory exists and is **empty** (`ls -a` → `.` `..` only). Listed as a companion of the plan with no ABSENT mark. On `ceo-3-1788468144` the analogous `final/page/` holds `final-plan.html`. |

## Not defects, checked and cleared

- **`final/CENSUS.md`, `final/COVERAGE.md`** (lines 17, 5215, 5600, 5702) — absent on this branch, but the header names the branch that holds them (`ceo-3-1788468144 at 7286420, which holds final/`). Verified present there. **EXISTS-as-claimed on a named branch.**
- **The twelve proposed agent files** — `analyst · architect · challenger · curator · growth · guard · operator · product · scout · steward · tester · writer`, all `.claude/agents/*.md`, all absent on disk, **all carry an explicit `— ABSENT` in the same table row** (§19.1 rows 0–13, plus §2 and §5 for `operator`). ABSENT-and-marked.
- **`scripts/consume-dispatch.ts` · `scripts/check-cold-start.ts` · `scripts/trust-store.ts`** (§18.5, lines 5685–5687) — absent at repo root, present under `mission-control/`. The table header is *"Of the 60 files"* under §18.5 Mission control, and line 5739 writes the full `mission-control/scripts/consume-dispatch.ts`, so the prefix is established by the table. Cleared.
- **`MANIFEST.json`, `CURATION.yml`, `routers/INDEX.md`** — bare in prose, all present under `.claude/skills/`.
- **`MEMORY.md`** (lines 276, 3662) — not a repo path claim; it is the Claude Code vendor memory feature, quoted from `research/memory.md`.
- **`bin/fleet-install.mjs` · `bin/install.js` · `bin/warroom`** — real files on this branch, not design names. `bin/` holds exactly 5 files as §19 claims.
- **The header's four shas** — `b2cabad`, `7286420`, `7fe8ede`, `4770d39` — all resolve.
- **`docs/08-agents_work/handoffs/2026-09-05-THE-PLAN-NEXT-TEAM-PROMPT.md`** — absent here, present on both branches the header names (`ceo-3` and `origin/docs/final-plan`). Cleared.

## Drift table — measurements re-measured on disk

| Figure as written | Line · section | Disk says | Verdict |
|---|---|---|---|
| `~/.agentvibe/events.jsonl` — *"1.1 MB, **3,840 rows**"* | 4375, §15 | **3,843 lines**, 1,119,473 bytes | **DRIFT 3,840 → 3,843.** The doc contradicts itself: lines 5217 (§19) and 5402 (§17) both write **3,843 lines** for the same file. The byte figure is fine — 1,119,473 B = 1.07 MB, rounds to 1.1 MB. |
| *"`.qa/verdicts/` holds **50** records, every one `verdict: PASS`"* | 6103, §23 | **68** on this branch · **80** on `origin/main` | **DRIFT 50 → 68.** Also self-contradicting: line 5612 (§18) writes *"534 lines / **68 records** on this branch"*, which is correct. 50 is the figure inherited from `CLAUDE.md`, measured at `d1294a4`. The claim built on it — that none satisfies the 2-of-3 multi-judge tier — is unaffected. |

## MATCH — 27 figures re-measured and correct

| Claim | Site | Measured |
|---|---|---|
| 18 files in `.claude/agents/` | 5217, 664, 208 | 18 |
| 135 entries under `.claude/skills/` (134 skills + `routers/`) | 5217, 1943, 5646 | 135 dirs, 134 `SKILL.md` |
| 6 playbooks · 16 commands · 5 files in `bin/` · 8 files in `.claude/hooks/` | 5217 | 6 · 16 · 5 · 8 |
| 60 files in `mission-control/` | 4375, 5217, 5680 | 60 tracked |
| `events.jsonl` 3,843 lines | 5217, 5402 | 3,843 |
| 48-step check suite | 3020, 5613 | `STEPS.length` = 48 |
| 10 exclusions | 5613 | `Object.keys(EXCLUDED).length` = 10 |
| `run-checks.mjs` 312 lines · `check-suite.js` 1,978 lines | 5613 | 312 · 1,978 |
| `verdict.mjs` 534 lines | 5612 | 534 |
| `.qa/verdicts/` 68 records | 5612 | 68 |
| `orchestrator.md` 154 lines | 5233 | 154 |
| `consume-dispatch.ts` 685 lines | 5685 | 685 |
| `CURATION.yml` 462 · `MANIFEST.json` 870 lines | 5646 | 462 · 870 |
| 7 routers + INDEX | 5646 | 8 files in `routers/` |
| 86 design docs on TREE B (`ceo-1-1788468144`) | 5701 | 86 `.md` under its `docs/03-system-design/` |
| `docs/02-competitive/` — 1,083 · 901 · 2,157 lines, 5 studies | 5700 | `open-source.md` 1,083 · `hands.md` 901 · `concepts.md` 2,157 · `reference-systems/` 5 files |
| this branch = `b2cabad` · ceo-3 = `7286420` · docs/final-plan = `7fe8ede` · origin/main = `4770d39` | 17–20 | all four resolve exactly |
| `claude 2.1.261` · `codex ABSENT` | 20 | `2.1.261 (Claude Code)`; no `codex` on PATH |
| forty-one rows, v1–v41 | 246, §1.1 | v1–v41 all defined as rows, all 41 used |
| 24 sections plus §13a | structure | headings 0–23 plus `13a` |

**One low-confidence note on line 5700.** The row is headed *"`docs/02-competitive/` — TREE B only"*. The three line counts and the five studies are TREE-B-only files (`expansion/`, `reference-systems/`), which is why the row measures correctly. But `docs/02-competitive/` **itself exists on this branch** with `LANDSCAPE.md`, `MOAT.md`, `POSITIONING.md`, `competitors/` — 237 lines. Read strictly, *"TREE B only"* is wrong about the directory and right about everything it counts.

## The `round-6` finding — one mention, an inventory entry

`grep -nic 'round.6'` over the subject returns **1** (line 5701, §18.6): the design record row naming "round-6" among prior design documents whose collective fate is `SURVIVES`. It is an **inventory entry**, not a citation of round-6 content and not the not-read statement. The not-read statement is header line 10, spelled "round-six": *"KEEL ONLY, AGAIN — THE-PLAN.md, mind-2, Fable's round-six design and the buy lane were NOT read, for the second round running"*. Consistent: a document can be inventoried by name without being read. The lane never opened `docs/03-system-design/round-6/`. `Keel 2,682 lines` on that row is therefore **UNMEASURABLE-HERE** — no `keel`-named file exists on HEAD, origin/main or origin/docs/final-plan.

## The remaining literal `BLOCKED`

One occurrence, line 286, §1.1, inside the **v37** row: *"neither reading was in the spine until §6 returned BLOCKED"* — historical narrative of how v37 arose, not a live status. The row's mechanism (`bin/run`, ABSENT) is present and marked. No occurrence in any heading, frontmatter, status table or coverage row.

**Adjacent observation:** `bin/…` verbs are consistently marked `(ABSENT)` in place (lines 400, 944, 1565); the `keel/…` prefixed forms are the ones that go unmarked — Part 4.
