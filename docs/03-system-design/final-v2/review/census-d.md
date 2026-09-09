*Recorded verbatim by the orchestrator from the lane's return file (scratchpad/returns/census-d.md, 20049 bytes). Sealed lane: reviewer engine on Opus 5, measurement only; no review/, rethink-2/, returns/ or session files read. A fix round was editing parts/ concurrently, so every figure is the assembly as it stood at 12,094 lines. Findings, never fixes.*

# Census D — measurement of FINAL-PLAN-v2.md after the fixer round
2026-09-06 · reviewer engine, Bash, measurement only · branch `ceo-1-1788609834`

**What was measured.** `docs/03-system-design/final-v2/FINAL-PLAN-v2.md`, read whole (12,094 lines,
1,227,154 bytes), as the assembly stands at the time of this run. A fix round was editing `parts/`
concurrently; every figure below is the assembly as it was on disk when read, and the orchestrator should
re-run anything the fix round moves. Nothing was written except this file.

**Headline.** The plan's internal reference graph is complete: **v1–v106, O1–O127, W1–W41, R1–R40 and E1–E15
all resolve, in both directions, with zero dangling ids and zero orphans.** Of ~60 repo figures re-derived
from the tree, **48 match to the digit**; 9 have drifted, all in the expected direction (the corpus grew) or
because a rolling log window moved. **One genuine internal disagreement was found** (measurement 5): §17.1's
roster table still carries the pre-E7 wording of the second family's carrier for four agents.

---

## 1 · Backticked repo paths — exists / ABSENT-marked / absent-and-unmarked

381 distinct path-shaped backticked tokens, 6,379 backtick spans in total.

| Class | Count |
|---|---|
| Not a repo path — GitHub `owner/repo`, HF model ids, vendor policy URLs, `~/.ssh`-class machine paths, CLI flags, shell expressions | 53 |
| Exists at the literal path in this tree | 59 |
| Resolves by suffix to a real file in this tree (e.g. `research/cloud.md` → `docs/03-system-design/final-v2/research/cloud.md`) | 64 |
| Absent, ABSENT-marked on its own line or listed in §19.2 / §19.2a / §19.2b | 126 |
| Glob or `<placeholder>` — 23 marked, 25 unmarked; every one under `keel/` or `.claude/**` | 48 |
| Absent with no per-line marker | 31 |

**The 31 with no per-line marker resolve to zero genuine holes**, under the plan's own two conventions:

- **22 are covered by a blanket marker.** §17.4: *"Every `keel/…` path in this section is ABSENT"*; §17.8:
  *"Every path in this tree is ABSENT"*. These are the eleven `keel/*` paths plus eleven bare basenames of
  them (`routing.yml`, `market.jsonl`, `ledger.jsonl`, `backlog.jsonl`, `intents/`, `shared/schemas/`,
  `tools/higgsfield.yml`, `RUNBOOK.md`, and the rest).
- **8 exist on a named branch, and the plan names the branch.** The header states *"ceo-3-1788468144 at
  7286420, which holds final/"* — verified: `docs/03-system-design/final/{CENSUS,COVERAGE,DECISIONS,FINAL-PLAN}.md`
  are on that branch and on no other, absent from `HEAD` and from `main`. `expansion/`,
  `reference-systems/`, `open-source.md`, `hands.md`, `concepts.md` are on TREE B (`ceo-1-1788468144`),
  exactly as §18.6 states.
- **`web/`** is cited only in the sentence that asserts its absence (§18.5: *"there is no `web/`"*) — correct.
- **`MEMORY.md`** is the vendor's own memory file, not a repo path.

**Result: zero absent-and-unmarked repo paths.**

---

## 2 · Reference resolution — §, vNN, Onn, Rnn, Wnn, En

Defined sets, taken from SPINE:

| Set | SPINE section | Defined | Contiguous | Cited in the plan | Dangling in the plan |
|---|---|---|---|---|---|
| v | §A | v1–v106 (106) | yes | 106 of 106 | 0 |
| O | §L | O1–O127 (127) | yes | 127 of 127 | 0 |
| W | §M | W1–W41 (41) | yes | 41 of 41 | 0 |
| R | §N | R1–R40 (40) | yes | 40 of 40 | 0 |
| E | DECISIONS §24 | E1–E15 (15) | yes | 15 of 15 | 0 |

- Plan §1.1 reproduces all 106 v-rows; no row is missing and no v107+ is referenced.
- The single apparent out-of-range id, `R128` at line 6,985, is **"EBU R128"**, the broadcast loudness
  standard. Not a reference.
- **§-references: 249 distinct.** Every in-plan `§N` and `§N.M` resolves to a heading. Fourteen do not
  resolve inside the plan and every one is explicitly qualified in its own sentence as another document's
  section: `DECISIONS §24` (22 sites), `FINAL §19.8 / §19.11 / §19.12 / §19.14`, the founder's list
  `§04 / §05 / §23–§30 / §31 / §35`, and `surfaces.md`'s `§4A.11`. **Zero dangling § references.**
- Every SPINE section the plan cites (§A–§N, including subsections §B.1–§B.4, §C.1–§C.4, §D.1–§D.2,
  §E.1–§E.4, §G.1–§G.5, §H.1–§H.5, §L.1–§L.4) exists in SPINE.md.

**One status contradiction surfaced while resolving references.** **R9** is listed `OPEN` in §20.8's table
(line 11,445) while §13.3 (line 11,684) and §6.4 (line 11,880) both state that R9 is **answered by O90**,
with R32 as the residue. Two statements about one question's status.

---

## 3 · Counts re-derived

| The plan's figure | Where | Measured | Verdict |
|---|---|---|---|
| 106 decision rows | §1.1 header | 106 rows in §1.1; 106 in SPINE §A | MATCH |
| 127 mechanisms (O81–O127 the fixer round's 47) | §17.4.3, §19.2b | 127 O-rows in SPINE §L | MATCH |
| 41 world facts (W1–W41) | §1 | 41 in SPINE §M | MATCH |
| 40 research questions | §20.8 header | 40 in SPINE §N | MATCH |
| 7 pages | §14.3 | 7 rows | MATCH |
| 15 named roles (14 + Operator) | §5.2, §17.1 | 14 rows + Operator; wave 1 = 10, wave 2 = 5 | MATCH |
| "Eleven of the fourteen carry no shell" | §5.2, §12.7 | 3 agents hold un-struck `Bash` (builder, tester, designer) → **11** | MATCH |
| 91 nodes, 195 edges in §19.1's graph | §19.2b | **91 node definitions, 195 edge lines**; every edge endpoint defined, every node used | MATCH |
| §J losing images: 88, plus 89 and 90 added | §22 | SPINE §J: 78 numbered entries, max **90**; 31–42 is one stub row delegating to `parts/22-losing-images.md §22.2`, which the plan carries in full | MATCH (delegation, not a gap) |
| Coverage tally: 671 rows · 139 changed · IN 505 · RENAMED 88 · REFUSED 52 · OUTSIDE 13 · FOUNDER'S 13 | §23 | Re-derived with COVERAGE.md's own `awk`: **671 · 139 · IN 505 · RENAMED 88 · REFUSED 52 · OUTSIDE 13 · FOUNDER'S 13**; FINAL column **IN 410 · RENAMED 157 · REFUSED 77 · OUTSIDE 14 · FOUNDER'S 13** | MATCH, every cell |
| 10 research lanes (7 + world, room, cloud) | header | 10 files in `research/` | MATCH |
| 18 agent files, 135 skill entries (134 + `routers/`), 6 playbooks, 16 commands, 60 files in `mission-control/`, 5 in `bin/`, 8 in `.claude/hooks/` | §17 preamble | 18 · 135 · 6 · 16 · 60 · 5 · 8 | MATCH, all seven |
| `routers/` holds INDEX + 7 namespace routers | §17.2 | INDEX.md + 7 | MATCH |
| 13 namespaces | §7.6, §17.2 | 13 rows, every one claimed | MATCH |
| 48 check-suite steps, 10 exclusions | §18.1 | `check-suite.js`: STEPS 48, EXCLUDED 10 | MATCH |
| 42 claims in the ledger index | §18.1 | 42 | MATCH |
| `.qa/verdicts/` 68 on this branch, 80 on `origin/main`, every one PASS | §21.4 | 68 files, 68 PASS; `origin/main` 80 | MATCH |
| `.claude/settings.json` 39 allow/deny rules | §18.7 | 29 allow + 10 deny = 39 | MATCH |
| 2 MCP servers; 2 agents declaring `mcpServers` (designer, sourcer) | §8.6 | `.mcp.json`: playwright, claim-append; `designer.md`, `sourcer.md` | MATCH |
| `schema-lint` 18 pass · 0 fail · 0 warnings | §5, §18 | `npm run lint:agents` → `Summary: 18 pass · 0 fail · 0 warnings`, exit 0 | MATCH |
| Line counts: `schema-lint.js` 1947 · `ledger.mjs` 1531 · `evict-memory.mjs` 1125 · `check-citations.mjs` 846 · `verdict.mjs` 534 · `qa.js` 1182 · `qa-lead-pass.yml` 692 · `gates.yml` 221 · `qa-tier-floor.yml` 468 · `classifier.js` 187 · `run-checks.mjs` 312 · `check-suite.js` 1978 · `CURATION.yml` 462 · `MANIFEST.json` 870 · `lenses.yml` 201 · `review-lenses.yml` 230 · `design.js` 143 · `coding.js` 170 · `research.js` 187 · `pre-tool-use.sh` 676 · `session-start.js` 259 · `budget-guard.js` 204 · `CLAUDE.md` 886 · `AGENTS.md` 126 · `consume-dispatch.ts` 685 · `warroom` 3429 · `fleet-install.mjs` 1053 · `install.js` 308 · `install-war-room.sh` 149 · `init-from-template.sh` 147 · `.mcp.json` 12 · `mcp-policy.json` 65 · agent seeds 154/134/169/149/147/151/121 | §17.1, §18.1–§18.6 | every one | **MATCH, 39 of 39** |
| Aggregates: playbooks 284 lines · commands 791 · hooks 3,579 · DECISIONS.md 424 lines / 39,543 bytes · 2 archive volumes · war-room 4 entries / 62 files · 16 handoffs | §18 | all | MATCH |
| `budget-guard.js` "zero references in `settings.json`" | §18.4 | no hit in `settings.json`; the only other references are a comment in `qa.js` and two test files | MATCH |

### Counts that drifted

| Figure | Plan | Measured now | Note |
|---|---|---|---|
| `final-v2/page/final-plan-v2.html` | 169,402 bytes, 93 tiles | **253,283 bytes, 143 tiles** (`class="tile"`) | The page was regenerated after the plan's last write. The header figure is stale. |
| Branch head | `ceo-1-1788609834 at b2cabad` | HEAD is **`1e8dab1`**, 119 commits ahead of `b2cabad` | Header says "carrying this session's own documentation commits on top", so self-aware, but the pinned sha is not the head. |
| `LONG-TERM.md` | 84 lines | **92** | |
| Session files | 171 | **172** | +1, this session |
| `~/.claude/projects` | 60 project directories, 3,060 `.jsonl` (§18.4); 3,116 files, 3.1 GB, 56/day (§13.7, THINKER: A4) | **64 directories, 3,029 `.jsonl`, 2.9 GB**; 351 in 7 days ≈ **50/day** | The `.jsonl` count moved *down* against a claim of daily growth; worth one line from whoever owns A4. |
| Commits: Claude Code vs founder | 825 · 129 | **848 · 129** | Founder count exact; the machine count grew, as expected. |
| `ceo-*` worktrees | five | **six** (`git worktree list`: 20 worktrees total, 6 of them `ceo-*`) | |
| Agent-team members | 224 members, 219 `in-process` (W34) | **262 members, 257 `in-process`**, across **48** team config files | Team count exact. |

Other git facts in the header verify exactly: `ceo-3-1788468144 = 7286420`, `docs/final-plan = 7fe8ede`,
`origin/main = 4770d39`, local `main = b2cabad`.

---

## 4 · The thinker's on-Mac measurements (A1–A13), re-measured

| Id | The plan's figure | Re-measured | Verdict |
|---|---|---|---|
| A1 / W33 | `pmset -g custom` reads `sleep 1` on AC **and** battery | `sleep 1` under both `Battery Power` and `AC Power` | **MATCH** |
| A1 / W33 | 391 maintenance sleeps, 74 back-to-sleep, 24 clamshell, in seven days | **348 · 77 · 24** | Clamshell exact. The log's retained window has rolled forward (it now starts 2026-08-30 23:18 against R5's 21:44), which drops older maintenance episodes — the direction is consistent with the plan's own caveat that the log covers *"only the span it retains"*. |
| R5 | span 2026-08-30 21:44 → 2026-09-06 09:39, 156 h retained; zero episodes ≥ 1 h | span now **2026-08-30 23:18 → 2026-09-06 23:18, 168.0 h**; **zero episodes ≥ 1 h** | The zero holds. The 40.7 h asleep figure is **not reproducible** by a naive Sleep→Wake pairing of `pmset -g log` (mine returns 0.3 h), so I do not contradict it — it needs the original method to re-derive. |
| A2 / W34 | 48 teams; 224 members; 219 `in-process`; pane ids are the strings `"in-process"` and `"leader"`; **no teammate has a real `%N` pane** | 48 teams; 262 members; 257 `in-process`; pane id values are only `in-process` (214), `leader` (43), absent (5); **`%N` pane ids found: 0** | Load-bearing half **MATCH**; the two counts grew. |
| A4 / W35 | corpus 3,116 files, 3.1 GB, 56/day | 3,029 `.jsonl`, 2.9 GB, ≈50/day | drift (above) |
| A5 / W36 | outbound loopback `connect()` denied for sandboxed Bash | **NOT RE-MEASURED** — the network probe was denied in this session | untested here |
| A6 / W41 | five `ceo-*` worktrees, 825 commits by Claude Code to 129 by the founder | six worktrees, 848 to 129 | drift (above) |
| A7 / W38 | `~/.claude/daemon/{control.key, dispatch, roster.json}` and `~/.claude/jobs/` exist | all five present | **MATCH** |
| A9 / W37 | `gemini --version` → `EPERM` on `~/.gemini/settings.json` under the live sandbox | reproduced verbatim: `EPERM: operation not permitted, open '/Users/adamks/.gemini/settings.json'` | **MATCH** |
| A12 / W39 | `budget-guard.js` baseline: peak **1,961,285** output tokens in any rolling 5 h over **99 transcripts** | source comment reads *"Measured baseline across 99 transcripts and 16,900 turns: peak 1,961,285 output tokens in any rolling 5h window"* | **MATCH, exact** |
| A13 / W40 | ≈53 tokens per skill; 134 skills; **28,250 bytes** of `name`+`description`; ≈7k tokens at 134 | 134 skills with a `SKILL.md`; **28,078 bytes**; **52.4 tokens/skill**; **7,020 tokens** | ≈MATCH; the byte figure is 172 low (0.6%) |
| A14 | `sessions_ceiling` 3 until measured; RSS per child unmeasured, `ps` denied in the sandbox | `sysctl hw.memsize` returned empty under this sandbox — consistent with the plan's own note | consistent |
| A17 / W35 | `claude --help` at 2.1.263 lists `--no-session-persistence`, `--settings`, `--setting-sources`, `--agents`, `--autocompact`, `--fallback-model`, `-w/--worktree`, `--tmux` | `claude --version` → **2.1.263**; all eight flags present, including the short form `-w, --worktree` | **MATCH, all eight** |
| — | `codex` not installed | `command -v codex` → absent | **MATCH** |
| — | `gemini` 0.38.2 installed | version unreadable (the `EPERM` above) — consistent with the plan's own account | consistent |
| — | `~/.agentvibe/events.jsonl` 3,843 rows, 1.1 MB | 3,843 rows, 1,119,473 bytes = 1.1 MB | **MATCH** |
| — | `prompt-standard.test.mjs` pins `claude-opus-5`, `claude-sonnet-5`, `claude-fable-5`, `claude-haiku-4-5`, and `claude-fable-5-1` is **not** in it; `claude-sonnet-4-6` appears | `assert.deepEqual(VALID_MODELS, ['claude-opus-5','claude-sonnet-5','claude-fable-5','claude-haiku-4-5'])` at line 214; `claude-sonnet-4-6` at 218–219 as the negative test | **MATCH** — the blocking lint the plan names is real |

---

## 5 · One fact stated two ways — the ten most-cited figures

| # | Figure | Sites | Verdict |
|---|---|---|---|
| 1 | Wave one count | 5 | **Consistent** — every site reads *ten including the Operator*, with *eight* struck through as superseded; wave two five at every site; 10+5 = 15 across §5.0, §3.6, §17.1, §19.1's `AGENTS1`, §20.7 |
| 2 | Shell count | 2 | **Consistent** — *eleven of the fourteen carry no shell*, and it re-derives from §5.2's own `Tools` column |
| 3 | Page order | 10 | **Consistent** — `4 → 5 → 3 → 2 → 7 → 1 → 6` at 8 sites, `P4 → … → P6` at 2 |
| 4 | The Operators shape | 16 | **Consistent** — N Operators as `kind: operator` rows. All 8 *"one Operator"* strings are losing-image or superseded-narrative framings (§J 77, *"one Operator was already false"*); none asserts one Operator as the design |
| 5 | Founder hours | 12 | **Consistent** — `founder_hours:` per weekly window, harness number **20**, *a bind at 20 is reported, never enforced silently*, at every site |
| 6 | Which budget seed | 12 | **Consistent** — six per five-hour window until R34. Minor wording variance only: `decisions_per_window × horizon` (5 sites) against `× intent.horizon` (3) |
| 7 | The ladder's top step | 11 | **Consistent** — `first-contact` reachable like any other class after N recall-free sends; *"stopping below"* appears only as the losing image (§J 84) |
| 8 | **The second family's carrier** | 45+ | **DISAGREEMENT — see below** |
| 9 | The night predicate | 44 | **Consistent** — `night_capable` from `pmset` (AC · `sleep 0`/`disablesleep 1` · assertions) every tick, refuse-and-route on false |
| 10 | The cloud lane's status | 6 | **Consistent** — PR reviewer admitted, maker UNVERIFIED, the night's fallback |

### The one disagreement

**§17.1's roster table still carries the pre-E7 wording for four agents.** §5.2 carries the corrected form;
§17.1 does not, and the difference is the whole of what E7 · v90 · O92 decided.

| Agent | §5.2 Model cell | §17.1 Model cell |
|---|---|---|
| `reviewer` | `claude-sonnet-5`; ~~a second family when reachable~~ the second family is the **Gemini CLI or Codex CLI as a `bin/run` child from launchd, no key** — rung 4 until the calibration set passes | `claude-sonnet-5`; **a second family when reachable** |
| `challenger` | same corrected form | `claude-opus-5`; **a second family when reachable** |
| `scout` | ~~Gemini once authenticated~~ the Gemini CLI on a personal account, **only as a `bin/run` child from launchd** *(E7 · v90, O92; W37)* | `claude-sonnet-5`; **Gemini once authenticated** |
| `curator` | the summarising half on ~~Gemini or a local model~~ **the Gemini CLI as a `bin/run` child from launchd**, or a local model *(E7 · v90)* | `claude-sonnet-5`; the summarising half on **Gemini or a local model** |

This is the exact class §13a.9's *deletion 26* claims to have closed — *"§11.3 keeps the one copy whose
state is honest"*, five of six copies deleted — and the class §5.2a predicts, since the `roster.yml`
generator that would make §17.1 a rendering is ABSENT. Two of the four surviving copies are the sentence
deletion 26 names. Model ids themselves agree across both tables; only the carrier clause differs.
(`builder`, `architect` and `writer` differ in wording between the two tables but not in substance.)

---

## 6 · The `class:` column

**SPINE §L — all 127 rows carry a class cell, none missing:**

| class | count |
|---|---|
| kernel | 94 |
| adapter | 31 |
| refuse | 2 |
| **total** | **127** |

(Counted from the pipe-delimited `class` cell of every `| **Onn** |` row in §L; a column-position read gives
kernel 89 · adapter 30 · refuse 2 with 6 rows shifted by an escaped pipe in an earlier cell, which is why
the cell-pattern count above is the one to use.)

**Mechanisms in the plan lacking a class:**

- Of **O81–O127** — the 47 rows v96 · O105 requires a class on — **46 state a class in the plan's own text**
  within a line of a mention. **One does not: O102.** SPINE gives it `kernel · truth`; the plan cites O102 at
  14 sites (§0.1a, §2.2, §11.2, §11.11a, §19.1's `R27RUN`, §19.2b, §20.1 row 16, §20.8, §21.1b, §21.4) and
  states no class at any of them.
- Of **O1–O80**, 52 of 80 state no class in the plan. This is by the plan's own convention — §13a's table
  says *"v96's `class` on each is SPINE §L's, not restated"* — and SPINE carries all 127.

---

## Scope notes

- **Single model family.** This is one reviewer on one model. It is not an independent panel, and nothing
  here satisfies the `irreversible` tier's 2-of-3 multi-judge requirement or `risk: high`'s ≥2 distinct
  model families. The plan states the same limitation about itself (§21.4, exit condition 2026-11-17).
- **The seal was kept.** `round-6/`, `final-v2/review/`, `rethink-2/`, the scratchpad `returns/` directory
  and every session file were not opened. `SPINE.md` and `DECISIONS.md §24` (lines 309–360) were read only
  to check that rows the plan cites exist and say what the plan says they say, which is what the brief
  permits. Directory listings were used to establish that `review/` and `rethink-2/` exist; no file in
  either was read.
- **Lane counts not measured.** The header's *"three sealed thinker lanes"* and *"three sealed fixer lanes"*
  would require reading `review/` and `rethink-2/`. Left unmeasured on purpose rather than measured against
  the seal.
- **Concurrency.** `parts/` was being edited by a fix round during this run. The assembly was read as it
  stood; the page-HTML figures in particular are already stale by a regeneration that happened after the
  plan's last write (23:13 against 22:53).
- **Not re-measured.** W36 / A5 (outbound loopback `connect()` denied) — the network probe was denied in
  this session. R5's 40.7 asleep hours — the original pairing method is not recoverable from the log alone.
  `hw.memsize` — denied under this sandbox.
- **Two findings outside the six measurements**, recorded once and not expanded: R9's status contradiction
  (§2 above), and the four-row carrier drift between §5.2 and §17.1 (§5 above). Both are census facts, not
  lens judgements; the contradictions brief belongs to Challenge D.
