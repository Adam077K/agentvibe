# Enforcement Diagnostic — 2026-08-11

**Purpose:** the before-measurement for the agent system rebuild. This is the only before/after measurement
the rebuild offers, so it is recorded as evidence rather than prose.

**Method.** Every number below was produced by opening the implementing file and reading its actual exit and
decision paths — not by pattern-matching. Each is marked **VERIFIED** (file opened, code path read) or
**ESTIMATED** (pattern-matched). An unmarked number is a claim about work nobody did.

**Rule applied throughout:** a count produced by pattern-matching is a hypothesis, not a finding.

---

## Corrections — recorded 2026-08-11 during Phase 1 execution

**This diagnostic broke its own rule in seven places.** Where it says VERIFIED below, some numbers were in
fact produced by pattern-matching, and re-checking them against the implementing file changed the answer.
The original claims are left in place unedited so the before-measurement stays auditable; each is corrected
here.

| # | Original claim | Verified truth | How it was found |
|---|---|---|---|
| §3.1 | 12 GSD execution agents "all 12 missing repo-wide" | All 12 exist in `~/.claude/agents/`, which the runtime searches alongside `.claude/agents/`. **Not a fabrication** — an environment dependency a fresh clone will not have | listed the global agent dir |
| §3.2 | 6 Lead agent files missing | All 6 exist in `~/.claude/agents/`. The real defect was different: `AGENTS.md` declares the 9-lead model retired and then routes to those leads anyway | same |
| §3.3 | `/build` dispatches three Leads that "none exist" | Same as above. Real defect: the commands contradicted the retirement note | same |
| §3.4 | README's "51 `.md`" agents wrong; actual 26/60 | 26 top-level + 25 war-room = **51. Correct as written.** The "60" counted the 9 `_seeds` orphans | counted both directories |
| §3.5 | "147 skills" wrong; 143 SKILL.md, MANIFEST claims 154 | **147 is correct** — the unique-skill count. 154 counted 7 self-nested directories twice. 143 was a `maxdepth` artifact | `find` at full depth, then dedupe by name |
| §3.6 | MANIFEST lists 4 `aws-*` skills with no directory | All 4 existed at `.claude/skills/security/aws-*/`. **All 154 paths resolved.** Now flattened to top level, and the runtime discovers them | `os.path.isfile` on every manifest path |
| §4 | `qa-lead-pass.yml` is 176 lines with 4 blocking `exit 1`s | **343 lines, 6 `exit 1`s**, and it reads a `CONNECTIONS.md` that exists nowhere | `wc -l`, `grep -n` |

Two further defects the diagnostic missed entirely:

- **Every one of MANIFEST's 154 paths pointed into `.agent/skills/`** — the directory this diagnostic
  recommended deleting. Deleting it first would have broken the skills system in the same commit.
- **`AGENTS.md`'s model column disagreed with the agent files in 7 rows**, not the 1 reported. Two cited
  "Opus 4.6", which is not in `schema-lint.js`'s `VALID_MODELS` at all.

**Net: of 16 reported fabrications, 6 were not fabrications, 9 were real, and 1 (nested spawn) was resolved
by probe.** The lesson is the one this file already states and did not follow: a count produced by
pattern-matching is a hypothesis. `scripts/check-registration.mjs` now performs these checks by execution on
every PR, which is the only durable fix.

---

## Headline

| Measure | Reference system | **This system** | Mark |
|---|---|---|---|
| Stated imperative rules | 63 | **~1,736 lines** | ESTIMATED (grep) |
| Distinct normative directives in CLAUDE.md | — | **~55** | VERIFIED (read in full) |
| Mechanisms that can block | 9 | **1** | VERIFIED |
| Fabricated mechanisms | 6 | **16** | VERIFIED |
| Enforcement ratio | 14% | **~2%** | derived |
| Launcher generations across the fleet | — | **5, across 13 projects** | VERIFIED |

**One-line summary:** ~1,700 stated imperatives, one live blocking mechanism covering only dangerous shell
commands, and the repo's single best enforcement asset — a working, blocking agent-schema validator — is
registered nowhere.

---

## 1 · Stated rules (ESTIMATED — grep)

~1,736 imperative lines ("always", "never", "must", "MUST", "DO NOT", "required", "before any").

| Location | Lines | Files |
|---|---|---|
| `.claude/skills/**/SKILL.md` | 670 | 154 |
| `.claude/agents/*.md` | 579 | 26 |
| war-room agents + `_seeds` | 282 | 35 |
| `docs/` | 151 | 38 |
| `.claude/commands/` | 31 | 13 |
| `CLAUDE.md` | 14 | 1 |
| `TEMPLATE-USAGE.md` | 4 | 1 |
| `AGENTS.md` | 3 | 1 |
| `README.md` / memory | 1 / 1 | 2 |

**0 of the 8 "Rules (All Agents)" in CLAUDE.md are enforced by any mechanism.** (VERIFIED)

## 2 · Mechanisms that execute (VERIFIED — every file opened)

| Mechanism | Registered? | Can block? | Actual exit path |
|---|---|---|---|
| `.claude/hooks/pre-tool-use.sh` | yes — PreToolUse | **YES** | `exit 2` (line 38). ~10 dangerous-bash + `.env`/migration rules |
| `.claude/hooks/post-edit-typecheck.sh` | yes — PostToolUse | no — **and dead** | `exit 0` L66. L34-37 requires `*/apps/web/*`; **no `apps/` dir exists** → always exits at L37 |
| `.claude/hooks/stop.sh` | yes — Stop | no | `trap 'exit 0' ERR` L28 + `exit 0` L138 |
| `gsa-context-monitor.js` | yes — PostToolUse | no | `process.exit(0)` L179 |
| `gsa-check-update.js` | yes — SessionStart | no | detached spawn + `unref()` |
| `gsa-statusline.js` | `statusLine` key | no | cosmetic |
| `package.json` scripts | **no scripts block at all** | — | — |

## 3 · Fabrications — claims that name a mechanism that does not do what is claimed (VERIFIED)

1. `AGENTS.md` L66-77 — 12 named GSD execution agents (`executor.md`, `planner.md`, `verifier.md`…): **all 12 missing repo-wide**
2. `AGENTS.md` L85-97 — Build/Product/Growth/Business/DevOps/Data Lead routing: **6 agent files missing**; L27 of the same file says they were retired
3. `.claude/commands/build.md` — dispatches `Build Lead` / `Product Lead` / `DevOps Lead`: **none exist**
4. `README.md` L10 — "51 `.md`" agents → actual **26** top-level / **60** recursive
5. `README.md` L11 + `CLAUDE.md` L36 — "147 skills" → **143** SKILL.md / 144 dirs / MANIFEST claims **154**
6. `MANIFEST.json` — lists 4 skills with no directory: `aws-compliance-checker`, `aws-iam-best-practices`, `aws-secrets-rotation`, `aws-security-audit`
7. `.archive/pre-beamix-bundle-2026-05-25/` — cited **7×** across CLAUDE.md, README, TEMPLATE-USAGE: **directory does not exist**
8. `CLAUDE.md` L100 — "Haiku schema-lint hook only (auto-pass)": schema-lint is in **zero** hooks
9. `CLAUDE.md` L76 + `AGENTS.md` L109 — `.claude/memory/sessions/`: **missing** (real path `docs/08-agents_work/sessions/`)
10. `AGENTS.md` L110 — `.claude/memory/specs/`: **missing**
11. `package.json` `files[]` includes `.claude/get-shit-done/`: **missing**
12. `README.md` L15 — "MCP grants | .claude/settings.json": settings.json has **no `mcpServers` key**; no `.mcp.json` anywhere in repo
13. Model contradiction — `CLAUDE.md` L86 routes CEO to Opus 4.7; `AGENTS.md` L21 says Sonnet 4.6. AGENTS.md L53/57 cite "Opus 4.6", absent from schema-lint's `VALID_MODELS`
14. `war-room/INDEX.md` — stale: claims 22 agents, actual 25; missing 3 personas added after it was written
15. 12 war-room Routines reference Linear, Supabase `audit_log`, Inngest and Mem0 — **none configured in this repo**
16. **Operating instructions state "subagents cannot spawn subagents (nested Task is blocked)."** Probed live 2026-08-11: **false.** A subagent had `Agent` in its primary tool list, called it, and the nested agent returned `NESTED_OK` in 1.8s. Depth-2 confirmed. *(Caveat: plan mode active, nested agent read-only. Write-capable nesting outside plan mode still needs one confirming test.)*

Also dead, not counted as fabrication: `war-room/dashboard/server/db.ts` `initDb()` creates SQLite tables with
**zero `INSERT`s anywhere**; `server/collectors/subagents.ts` (126 lines) is never imported; `OfficeCanvas.tsx:260`
reads `ceo.subagents`, which the server never populates.

*Not counted:* `CLAUDE.md` L105 and `TEMPLATE-USAGE.md` L134-143 honestly disclose the CI workflows are staged,
not installed. `.claude/memory/DECISIONS.md` is an empty template — zero claims, so zero fabrications.

## 4 · Mechanisms written and never wired (VERIFIED)

**The headline find.** `.claude/hooks/schema-lint.js` — 360 lines, correct and complete. Validates agent
frontmatter, 8 mandatory body sections, and skill names against MANIFEST.json. Blocking exit path at L354:
`process.exit(failCount > 0 ? 1 : 0)`. It appears in **zero** hooks blocks and **zero** workflows; the only
references anywhere are prose mentions in README L12 and CLAUDE.md L100.

Executed read-only 2026-08-11: **exit code 1 — 11 pass · 15 fail · 5 warnings.** Wired today it would block
on 6 agents referencing skills absent from MANIFEST and on `design-polisher.md` (`maxTurns=50`, range `[5,30]`).

Also unwired:
- `.claude/workflows/lib/gate-logic.mjs` — **23/23 tests pass**, nothing runs them
- `qa-lead-pass.yml` (176 lines, 4 blocking `exit 1`s) and `promptfoo-eval.yml` — live only in
  `new agents-skills-workflows-system/.github/workflows/`. **There is no `.github/` at the repo root or in the
  main repo**, so GitHub has never seen either
- `.claude/qa-tier-floor.yml` — its only consumer is that unreachable workflow
- `.claude/workflows/{qa,coding,design,research}.js` — executable fan-out engines with a binding `PASS|BLOCK`,
  invocable by name via the runtime `Workflow` tool but **required by nothing**

## 5 · Inventory (VERIFIED)

Agents **26** top-level `.md` (+25 war-room, +9 `_seeds` = **60**) · skills **144 dirs / 143 SKILL.md**
(MANIFEST claims 154) · commands 13 · hooks 7 files (6 registered, 1 orphan) · root workflows **0** ·
MCP config **0**.

| Directory | Status |
|---|---|
| `new agents-skills-workflows-system/` | Near-duplicate of `.claude/` plus the 2 CI workflows. **Dead**, still branded "Beamix" |
| `war-room/` | tmux `.tmpl` sources installed by `bin/install-war-room.sh` |
| `war-room-dashboard/` | 55-file Hono+Vite app — the **generated install output** of `war-room/dashboard/`; all differing files differ only by placeholder substitution |
| `.agent/` | Mirror of `.claude/`; hooks byte-identical (`diff -rq` clean) |
| `bin/` | 3 manual installers; `install.js` is the npm bin entry |
| `scripts/` | 3 shell scripts, unreferenced (no `package.json` scripts block) |

## 6 · The fleet (VERIFIED)

`~/bin/<project>` is a ~2,765-line bash launcher, one standalone copy per project. Normalized for project name:

| Generation | Projects | State |
|---|---|---|
| 2,765 lines | `agentvibe`, `evalove` | byte-identical to each other |
| 2,768 | `acme` | 53 lines differ — **longer than the newest** |
| 2,744 | `beamix` | 79 lines differ |
| 2,740 | `aiclub`, `beeond`, `etsyc`, `finfun`, `ghostb`, `noam-website`, `realestate` | 39 lines differ |
| **2,406** | `adamos` | **1,029 lines differ** |

At function level, `acme` / `beamix` / `aiclub` / `agentvibe` have **identical 47-function sets** — the
differing lines are content (entry preamble, agent lists, project config), not capability.

`adamos` is not drift. It renames the core abstraction CEO→**CATO** (`inject_cato_prompt`, `register_cato`,
`clear_cato_state`) and **deletes worktree isolation** — `create_worktree`, `remove_worktrees`,
`migrate_sessions`, `restore_sessions` are all absent. A different design, shipped 27 Jul, with no record of
whether it worked.

`~/bin/newproject` (v2, 2026-05-25) clones the kit and substitutes placeholders. **There is no update path** —
hence five generations and nine `.bak.<timestamp>` files, three of which lost their execute bit.

---

## After Phase 1 — measured 2026-08-11

| Measure | Before | After | Mark |
|---|---|---|---|
| Mechanisms that can block | **1** | **5** | VERIFIED (each file opened, exit path read) |
| CI runs executed, ever | **0** | every PR | VERIFIED (`gh run list`) |
| `schema-lint.js` | exit 1 — 11 pass / 15 fail, registered nowhere | exit 0 — 26 pass / 0 fail, in CI + Stop hook + npm | VERIFIED |
| `gate-logic.mjs` 23 tests | passing, run by nothing | run on every PR | VERIFIED |
| Real fabrications | **9** (of 16 reported) | **0** | VERIFIED — 6 were miscounts, 1 resolved by probe |
| Tracked files | 2,290 | 644 | VERIFIED (`git ls-files`) |
| Rules in the governing set | — | **30** | VERIFIED (CLAUDE.md + AGENTS.md + commands) |
| Rules, full scope | ~1,452 | 1,353 | ESTIMATED (grep) |

**The blocking five,** each verified by opening the file and reading its exit path:
`pre-tool-use.sh` (`exit 2`) · `schema-lint.js` (`exit 1`) · `gate-logic.test.mjs` (nonzero on failure) ·
`build-skills-manifest.mjs --check` (`exit 1`) · `check-registration.mjs` (`exit 1`). The last four block
through [.github/workflows/ci.yml](../../.github/workflows/ci.yml).

**Rules ≤ 400 was not met and was not attempted.** It is unreachable by Phase 1's own work: 601 of the
1,353 remaining imperatives live in `.claude/agents/**` (collapsed in Phase 4) and 569 in
`.claude/skills/**` (curated in Phase 7). Phase 1's deletions touch almost none of it. The criterion was
re-scoped, with the founder's agreement, to the governing set Phase 1 controls — **30 rules, every one now
naming its mechanism or marked ADVISORY with the phase that will give it one** (see CLAUDE.md § Rules).
The ≤ 400 total moves to Phases 4 and 7.

**Proof of the gate.** PR #1: run `31505991227` **failed** (sha `a72ac4e`), run `31506094985` **passed**
(sha `d82d517c`). The red was not staged — `check-registration.mjs` caught `docs/04-product/specs/`
existing locally as an untracked empty directory and therefore absent from a fresh clone. The local run
passed; CI did not.

---

## How to reproduce

Re-run at each phase boundary and diff against this file.

**The reproduce script below did not reproduce the headline number** it was published with: it yielded
1,433 against a stated ~1,736 because it omitted `war-room/`, `README.md` and `TEMPLATE-USAGE.md`, which
the §1 table includes. The scope is corrected below. Phase 1 exit criteria as executed: governing-set rules
each naming a mechanism · blocking mechanisms ≥ 4 · fabrications = 0 · `schema-lint` exit 0 · CI executes
code on every PR · one PR observed red then green.

```bash
# 1 · stated rules — full scope, matching the §1 table (war-room and root docs included)
grep -rEc "always|never|must|MUST|DO NOT|required|before any" \
  CLAUDE.md AGENTS.md README.md TEMPLATE-USAGE.md \
  .claude/agents .claude/skills .claude/commands docs war-room \
  2>/dev/null | awk -F: '{s+=$2} END {print "full scope:", s}'

# 1b · governing set — the subset Phase 1 is accountable for
grep -rEc "always|never|must|MUST|DO NOT|required|before any" \
  CLAUDE.md AGENTS.md .claude/commands 2>/dev/null | awk -F: '{s+=$2} END {print "governing:", s}'

# 2 · mechanisms that can block — open each and read the exit path. Do not grep for this.
#     Expected 5: pre-tool-use.sh, schema-lint.js, gate-logic.test.mjs,
#     build-skills-manifest.mjs --check, check-registration.mjs
grep -rl "exit 2\|process.exit(1)\|exit 1" .claude/hooks scripts .github/workflows 2>/dev/null

# 3 · everything CI enforces, run exactly as CI runs it
npm run check; echo "exit=$?"

# 4 · fleet drift
for p in acme adamos aiclub beamix beeond etsyc evalove finfun ghostb noam-website realestate agentvibe; do
  sed -e "s/${p}/__P__/gI" ~/bin/$p > /tmp/norm-$p.sh 2>/dev/null
done
for p in acme adamos aiclub beamix beeond etsyc finfun ghostb noam-website realestate; do
  echo "$p: $(diff /tmp/norm-agentvibe.sh /tmp/norm-$p.sh | grep -c '^[<>]') differing lines"
done
```

---

*Diagnostic by: ceo · 2026-08-11 · consumed by [AGENT-SYSTEM-REBUILD.md](../03-system-design/AGENT-SYSTEM-REBUILD.md)*
