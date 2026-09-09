# Fleet migration — getting Codex to every project

*Measured 2026-09-09. Every figure here has the command that produced it beside it.*

---

## Why a migration is needed at all

The Codex engine layer lives in `bin/warroom`, installed once at `~/.warroom/bin/warroom` and
shared by every project that runs a **shim**. A project running its own **standalone** launcher
shares nothing, so it receives the engine layer never.

Census of `~/bin` (excluding `.bak*`):

```
for f in ~/bin/*; do grep -q '.warroom/bin/warroom' "$f" && echo shim || echo standalone; done
```

| | count | |
|---|---|---|
| shim | **1** | `agentvibe`, 385 bytes |
| standalone | **14** | ~100 KB each, a private copy of the program |
| carrying `engine_for_pane` | **0 of 15** | — |

`bin/warroom`'s own header records the cause: the standalone copies *"had drifted into 8
generations with no update path."* This is that sentence being paid for.

**Porting the engine layer into `war-room/bin/PROJECT_NAME.tmpl` instead is closed, not preferred
against.** That template has no config discovery at all — `grep -c '_cfg\|\.warroom\.yml'` → **0** —
so `engine:` has nowhere to live; and it already inlines a second copy of the CEO preamble, so a
port would make a third. See `war-room/README.md` § Engine choice.

---

## What the parity run found

`scripts/warroom-parity.sh <old-launcher> <generated-config>` drives six read-only commands through
both programs and diffs them byte-for-byte. Run against all thirteen live projects:

| Group | Projects | Parity | Disposition |
|---|---|---|---|
| **Clean** | ghostb · beeond · aiclub · etsyc · evalove · finfun · noam-website · realestate · beamix | 4 of 6, differing only on `help` and `cost` | **Migrate** |
| **Needs a preamble first** | ml2 · test1 · hitstampjavagame | 1 of 6 | **Migrate after extracting their inlined preamble** |
| **Do not migrate** | adamos | 2 of 6 | **Excluded — see below** |
| **Dead** | acme | — | `~/VibeCoding/Acme` does not exist |

### The two differences every project shows, and why neither is a regression

- **`help`** — four new `--engine` lines (the feature), plus `merge <N>` changing from *"Merge
  CEO-N's branch into main"* to *"Push CEO-N's branch and open a PR against main"*, with
  `merge <N> --local` restoring the old behaviour. That change is deliberate and predates this
  work: the model-resolved merge route was closed 2026-08-23. **`ml2` and `adamos` have no git
  remote** (`git remote get-url origin` → none), so on those two `merge` must be `--local`.
- **`cost`** — the old launchers are **broken**: `mapfile: command not found`, because macOS ships
  bash 3.2 and `mapfile` is bash 4+. The unified launcher runs it correctly. Migration *fixes* this.

### The defect the fleet survey found in `bin/warroom` itself

Two literals survived the extraction from agentvibe's copy: the restore banner and the help title
both said `Agentvibe`. Measured — `~/bin/ghostb` prints `ghostb — Ghostb CEO War Room`, and
`bin/warroom` printed `ghostb — Agentvibe CEO War Room`. **Thirteen of fourteen projects would have
been renamed by their own launcher.** Fixed by using `${SESSION_UPPER}`, which already existed and
was already used correctly at five other banner sites, and pinned by a test that asserts the
property — no project name in executable code — rather than the two lines that broke it.

### Why `ml2`, `test1` and `hitstampjavagame` need a step first

Their launchers carry an **inlined** CEO preamble (2,722 bytes for `ml2`; 921 for the other two) and
the projects have no `.claude/entry/ceo.md` or `_seeds/ceo.md`. The unified launcher warns and falls
back to a minimal preamble — honest, but weaker than what they run today. Extract each inlined
preamble to `<project>/.claude/entry/ceo.md` first and the migration preserves current behaviour
exactly. Note `ml2`'s own launcher is a stale Beamix-generation copy: it prints
`Beamix CEO War Room` and tells you to run `beamix done N`. Migration corrects that too.

### Why `adamos` is excluded

**It is not a CEO war room.** It runs **Cato** — a challenger persona with its own seed file
(`.claude/agents/_seeds/cato.md`, 2,734 bytes), its own injection (`@"cato (agent)"`), and its own
sub-roster of archivist, strategist, portfolio, researcher and scribe. It has no `CEO_PREAMBLE` at
all (`grep -c '^CEO_PREAMBLE=' ~/bin/adamos` → 0). Migrating it to the unified launcher would
replace Cato with a CEO. That is not a migration, and this exclusion is a correctness finding rather
than a preference.

Giving adamos the Codex engine means teaching `bin/warroom` a second persona, which is a design
question, not an install.

---

## Order of operations, and it is not interchangeable

**The shared launcher must carry the engine layer BEFORE any project becomes a shim.** Today
`~/.warroom/bin/warroom` is the 2026-08-11 build with no engine support, so migrating a project
first would move it from its own working launcher onto an *older* shared one — a regression.

1. Land the engine layer on `main` (binding gate, `irreversible` tier — `scripts/lib/judges.js`).
2. `node scripts/warroom-install.mjs install --config <path>` — writes `~/bin/<session>` and
   `~/.warroom/`, and **never** writes inside a project. Takes a backup; refuses an edited file
   without `--force`; `rollback --session <name>` reverses it.
3. Extract the three inlined preambles to `.claude/entry/ceo.md`.
4. Write each generated `.warroom.yml` into its project.
5. Re-run parity per project, then `<session> engine 3` to see the launch lines before starting
   anything.

**Reversibility, stated plainly:** every standalone launcher is preserved under
`~/.warroom/backups/`, and `~/bin/*.bak.*` copies already on disk are untouched. A project that
goes wrong is restored by one `rollback`.
