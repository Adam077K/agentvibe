# Fleet Baseline — 2026-08-11

**Purpose:** the verified before-measurement for **Phase 2 (Fleet: one program, many configs)**, and the
readiness brief for starting it.

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
received an update**, which is the same disease at a later stage. `test1` looks like a scratch project;
confirm before spending effort on it.

## 3 · The `adamos` fork (VERIFIED — needs a verdict in Phase 2)

Renames the core abstraction CEO → **CATO** and **deletes worktree isolation entirely**.

- **Absent (5):** `create_worktree()` · `remove_worktrees()` · `migrate_sessions()` · `restore_sessions()` ·
  `inject_ceo_prompt()`
- **Added (3):** `inject_cato_prompt()` · `register_cato()` · `clear_cato_state()`

Shipped 27 Jul with no record of whether it worked. Deleting worktree isolation is not a small opinion —
worktrees are what make parallel agent streams safe. **Adopt, revert, or document.** An unrecorded
architectural fork is a lapsed commitment.

## 4 · Distribution state (VERIFIED)

| Fact | Evidence |
|---|---|
| No update path in `newproject` | Only `rsync` at L125 for initial clone; no update/upgrade/sync/migrate path |
| `CEO_PREAMBLE` is an inlined bash literal | `~/bin/agentvibe` L53–84, pasted via `tmux send-keys` at L92 |
| No shared program directory | `~/.warroom/` does not exist |
| No per-project config file | No `.warroom.yml` anywhere |
| Backups accumulating unmanaged | 12 `.bak.<timestamp>` files in `~/bin/` |

Phase 2 is greenfield on the target side: nothing to migrate off, only the 15 copies to converge.

---

## 5 · What this changes about the Phase 2 plan

1. **Scope is 15, not 13.** `ml2`, `hitstampjavagame`, `test1` join the fleet inventory. Confirm whether
   `test1` and `hitstampjavagame` are live projects before converging them — retiring a launcher is cheaper
   than porting one.
2. **Target generation E, not B.** The plan implicitly treats `agentvibe` as the reference. Seven projects
   already share generation E; converging *toward* the 47-function set means E and B differ by 39 lines of
   content, and E is the larger installed base.
3. **`acme` must be diffed before it is overwritten.** At 2,768 lines it is *longer* than the newest build
   and 53 lines divergent — it may contain work that exists nowhere else. Read those 53 lines first.
4. **Stop condition 5 needs its number updated** — "the fleet is still on five launcher generations after
   Phase 2" should read **eight**.
5. **The check-only run is now the right first move and is genuinely read-only.** It produces the
   cross-project inventory with zero write risk, and this file is the baseline it gets diffed against.

## 6 · Readiness

| Gate for starting Phase 2 | State |
|---|---|
| Phase 1 merged and green on `main` | ✅ `1134a6f`, CI run `31507451993` |
| Enforcement able to catch a regression | ✅ 5 blocking mechanisms; `npm run check` exit 0 |
| Fleet baseline verified, not inherited | ✅ this file |
| `adamos` verdict | ❌ **open — founder decision** |
| `test1` / `hitstampjavagame` live-or-retired | ❌ **open — founder decision** |

Two open questions, both founder calls, neither blocking the read-only check-only run.

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
