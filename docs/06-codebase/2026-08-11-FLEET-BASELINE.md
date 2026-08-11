# Fleet Baseline — 2026-08-11

**Purpose:** the verified before-measurement for the fleet work — **Phase 2** (build the machinery on
`agentvibe`) and **Phase 9** (roll it out) — and the readiness brief for starting Phase 2.

**Why this file exists.** Phase 2's numbers came from
[the enforcement diagnostic](2026-08-11-ENFORCEMENT-DIAGNOSTIC.md), and Phase 1 found **seven of that
file's numbers wrong** — it pattern-matched where it claimed to verify. Phase 2 refactors the program you
launch every project with, so it is the last place to inherit an unchecked number. Everything below was
re-measured from `~/bin/` directly.

**Method.** Each launcher was normalized for its own project name (`sed s/<name>/__P__/gI`), then compared
by content hash, by diff against `agentvibe`, and by extracted function set. Reproduce script at the bottom.

---

## Headline — three corrections to the plan

| Plan / diagnostic said | **Verified** |
|---|---|
| 13 projects | **15 launchers** — `ml2`, `hitstampjavagame` and `test1` were never counted |
| 5 generations | **8 generations** |
| `adamos` drops 4 functions | **5** — it also drops `inject_ceo_prompt()` |

Everything else held: `adamos` is a genuine fork at 1,029 differing lines, the shared function set is
exactly 47, the `CEO_PREAMBLE` is ~30 lines (53–84) inlined in the bash literal, and `newproject` has no
update path.

---

## 1 · The 8 generations (VERIFIED — normalized content hash)

| Gen | Lines | Projects | Drift vs `agentvibe` |
|---|---|---|---|
| A | 2,768 | `acme` | 53 lines — **longer than the newest** |
| B | 2,765 | `agentvibe`, `evalove` | 0 (byte-identical after normalization) |
| C | 2,752 | `ml2` | 319 |
| D | 2,744 | `beamix` | 79 |
| E | 2,740 | `aiclub`, `beeond`, `etsyc`, `finfun`, `ghostb`, `noam-website`, `realestate` | 39 |
| F | 2,406 | `adamos` | **1,029 — a fork, not drift** |
| G | 1,398 | `hitstampjavagame` | 1,825 |
| H | 1,320 | `test1` | 1,937 |

Generation **E is the real fleet** — 7 of 15 projects on one identical build, all 39 lines from `agentvibe`.

## 2 · Capability vs content (VERIFIED — extracted function sets)

| Function count | Launchers |
|---|---|
| **47** (identical set) | `acme`, `agentvibe`, `aiclub`, `beamix`, `beeond`, `etsyc`, `evalove`, `finfun`, `ghostb`, `noam-website`, `realestate` — **11 of 15** |
| 45 | `adamos` (different set), `ml2` |
| 35 | `hitstampjavagame` |
| 33 | `test1` |

**This is the finding Phase 2 rests on, and it is now measured across 15 launchers rather than 4.**
Eleven of fifteen have byte-identical *capability*; they differ only in *content* baked into the program —
entry preamble, agent lists, project config. The launcher is a universal program with a few hundred lines of
project data compiled into it, distributed as 100% copy.

`hitstampjavagame` (35 fn) and `test1` (33 fn) are not forks — they are **earlier generations that never
received an update**, which is the same disease at a later stage. Both are out of scope (§4b).

## 3 · The `adamos` fork (VERIFIED — **excluded from scope**, no verdict required)

Renames the core abstraction CEO → **CATO** and **deletes worktree isolation entirely**.

- **Absent (5):** `create_worktree()` · `remove_worktrees()` · `migrate_sessions()` · `restore_sessions()` ·
  `inject_ceo_prompt()`
- **Added (3):** `inject_cato_prompt()` · `register_cato()` · `clear_cato_state()`

Shipped 27 Jul with no record of whether it worked. Deleting worktree isolation is not a small opinion —
worktrees are what make parallel agent streams safe. ~~Adopt, revert, or document.~~ **Founder decision
2026-08-11: leave it as-is.** It is out of scope, and recorded here only so the fork is not rediscovered as
a surprise later.

## 4 · Distribution state (VERIFIED)

| Fact | Evidence |
|---|---|
| No update path in `newproject` | Only `rsync` at L125 for initial clone; no update/upgrade/sync/migrate path |
| `CEO_PREAMBLE` is an inlined bash literal | `~/bin/agentvibe` L53–84, pasted via `tmux send-keys` at L92 |
| No shared program directory | `~/.warroom/` does not exist |
| No per-project config file | No `.warroom.yml` anywhere |
| Backups accumulating unmanaged | 12 `.bak.<timestamp>` files in `~/bin/` |

Phase 2 is greenfield on the target side: nothing to migrate off. Phase 2 builds the machinery on `agentvibe`; the 12 copies converge in Phase 9.

---

## 4b · Scope — founder decision, 2026-08-11

**Phase 2 converges 12 launchers. Three are explicitly out of scope and left untouched:**

| Excluded | Why it was a candidate | Disposition |
|---|---|---|
| `adamos` | CEO→CATO fork, worktree isolation deleted, 1,029 differing lines | **Leave as-is.** No verdict required. Not converged, not reverted, not documented further |
| `test1` | 1,320 lines, 33 functions — ancient generation | **Leave as-is** |
| `hitstampjavagame` | 1,398 lines, 35 functions — ancient generation | **Leave as-is** |

This removes the two open questions this file previously carried. It also removes the riskiest target:
`adamos` was the only launcher whose convergence would have meant re-introducing a deleted abstraction.

**In scope — 12 launchers, 5 generations:**

| Gen | Lines | Projects | Delta from `agentvibe` |
|---|---|---|---|
| A | 2,768 | `acme` | 53 lines — **older preamble only** (see below) |
| B | 2,765 | `agentvibe`, `evalove` | 0 |
| C | 2,752 | `ml2` | 319 lines; **lacks 2 functions** |
| D | 2,744 | `beamix` | 79 |
| E | 2,740 | `aiclub`, `beeond`, `etsyc`, `finfun`, `ghostb`, `noam-website`, `realestate` | 39 |

**11 of the 12 share the identical 47-function set.** Only `ml2` differs, and only by omission.

### Both previously-flagged risks are closed by measurement

- **`acme` holds nothing worth saving.** Its 53 divergent lines are an *older* `CEO_PREAMBLE` — the retired
  9-lead model, `.agent/` paths, and the "subagents cannot spawn subagents" constraint Phase 1 falsified. It
  is longer because the old preamble was more verbose, not because it is ahead. Overwrite freely.
- **`ml2` only gains.** It lacks `send_launch_claude()` and `wait_for_shell_prompt()` and adds nothing.

**Net: the only real differences across all 12 are the entry preamble generation, per-project config, and
`ml2`'s two missing functions.** That is the "one program, many configs" thesis confirmed by measurement
rather than assumed.

---

## 4c · Phase 2 decisions — founder, 2026-08-11

| # | Decision | Consequence |
|---|---|---|
| 1 | **Extract the preamble verbatim first; converge its content in a separate diff.** | Phase 2 stays a behaviour-preserving refactor. Each project's existing preamble moves to `.claude/entry/<role>.md` unchanged, so a regression is unambiguously the mechanism. The falsified nesting constraint and retired leads are fixed in a second, reviewable change |
| 2 | **The program's source of truth is `bin/warroom` in this repo**, installed to `~/.warroom/bin/`. | The fleet's single point of failure comes under the enforcement Phase 1 built — `npm run check`, schema-lint and the registration test gate every change, and CI runs on every PR |
| 3 | **Rollout: `agentvibe` → one pilot project → all 10 remaining at once**, executed in **Phase 9, after all 8 phases are complete.** | The pilot catches what `agentvibe`'s dev-repo status hides. Deferring to the end means one propagation of a finished system rather than seven of intermediate ones |
| 4 | **No project except `agentvibe` is written to before Phase 9.** | Phase 2 builds the propagation machinery and proves it on `agentvibe` alone. The check-only pass across the other 11 is read-only |

**Deferred, not open:** the pilot project is chosen at the start of Phase 9, not now. It should come from
generation E — that cohort is 7 of the 12 and differs from `agentvibe` by 39 lines, so it exercises a real
delta. `evalove` is a poor pilot precisely because it is byte-identical to `agentvibe` and would prove nothing.

**The cost of deferring, stated plainly:** 11 projects run the old launcher for the whole rebuild and keep
drifting while it runs. Re-run the reproduce script monthly; **if the generation count rises, the price of
waiting is going up** and the decision should be revisited (stop condition 5b).

---

## 5 · What this changes about the Phase 2 plan

1. **The fleet inventory is 15; Phase 2's scope is 12.** `adamos`, `test1` and `hitstampjavagame` are
   excluded by founder decision (§4b) and left untouched. This also removes the riskiest target — `adamos`
   was the only launcher whose convergence meant re-introducing a deliberately deleted abstraction.
2. **`acme` needs no special handling.** Its 53 lines were read: an older preamble, nothing unique.
3. **Stop condition 5 needs its number restated** — "five launcher generations" is **eight** across the full
   inventory and **five** within Phase 2's 12-launcher scope. The scoped number is the one Phase 2 is
   accountable for.
4. **The check-only run is the right first move and is genuinely read-only.** It produces the cross-project
   inventory with zero write risk, and this file is the baseline it gets diffed against.

## 6 · Readiness

| Gate for starting Phase 2 | State |
|---|---|
| Phase 1 merged and green on `main` | ✅ `1134a6f`, CI run `31507451993` |
| Enforcement able to catch a regression | ✅ 5 blocking mechanisms; `npm run check` exit 0 |
| Fleet baseline verified, not inherited | ✅ this file |
| Scope fixed | ✅ 12 launchers; `adamos`/`test1`/`hitstampjavagame` excluded |
| `acme` divergence understood | ✅ older preamble, nothing to salvage |
| `ml2` divergence understood | ✅ lacks 2 functions, adds none |
| Sequencing decided | ✅ extract-then-converge · repo-owned program · pilot-then-all |
| Pilot project chosen | ❌ **open — one name from generation E** |

**Phase 2 is ready to start on one open item**, and that item does not block the read-only check-only run,
which is where Phase 2 begins.

---

## How to reproduce

```bash
cd "$(mktemp -d)" && mkdir -p fleet
FLEET="acme adamos agentvibe aiclub beamix beeond etsyc evalove finfun ghostb hitstampjavagame ml2 noam-website realestate test1"

# NOTE: zsh does not word-split unquoted parameters — use ${=FLEET} in zsh, or bash.
for p in ${=FLEET}; do sed -e "s/${p}/__P__/gI" ~/bin/$p > fleet/norm-$p.sh 2>/dev/null; done

# generations
for p in ${=FLEET}; do echo "$(shasum fleet/norm-$p.sh | cut -c1-8) $p"; done \
  | sort | awk '{h[$1]=h[$1]" "$2} END {n=0; for (k in h) {n++; printf "%s :%s\n", k, h[k]}; print "GENERATIONS:", n}'

# drift + capability
for p in ${=FLEET}; do
  d=$(diff fleet/norm-agentvibe.sh fleet/norm-$p.sh 2>/dev/null | grep -c '^[<>]')
  f=$(grep -coE '^[a-z_][a-z0-9_]*\(\)' fleet/norm-$p.sh)
  printf "%-20s %5s diff-lines %3s functions\n" "$p" "$d" "$f"
done
```

---

*Measured by: ceo · 2026-08-11 · consumed by [AGENT-SYSTEM-REBUILD.md](../03-system-design/AGENT-SYSTEM-REBUILD.md) §4 Phase 2*
