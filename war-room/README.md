# war-room/ — Multi-CEO tmux templates

Source of truth for the multi-CEO tmux war-room. Installed into a new project
by `bin/install-war-room.sh` (called from `bin/init-from-template.sh` or `~/bin/newproject`).

## What gets installed

| Template | Installed location | Purpose |
|---|---|---|
| `bin/PROJECT_NAME.tmpl` | `~/bin/<project_name>` | Launcher for **generated projects** — an OLDER GENERATION than `bin/warroom`, not a copy of it (2768 LOC bash). Subcommands: `[N]`, `add`, `done N`, `kill`, `ls`, `task N "label"`, `grid`, `restore`, `--bare`, `send`, `broadcast`, `diff N`, `merge N`, `inbox`, `files`, `history`, `log`, `cost`, `events`, `brief`. **No `engine`, no `--engine`, no `.warroom.yml`** — see "Engine choice" below. |
| `tmux/PROJECT_NAME-hq.tmpl` | `~/.tmux/scripts/<project_name>-hq.sh` | HQ dashboard render loop (Catppuccin-themed status pane) |
| `tmux/PROJECT_NAME-status.tmpl` | `~/.tmux/scripts/<project_name>-status.sh` | Status bar right-side script (CEO count + time) |
| `tmux/PROJECT_NAME-scratchpad.tmpl` | `~/.tmux/scripts/<project_name>-scratchpad.sh` | Per-CEO 9-line context panel at pane bottom |
| `tmux/PROJECT_NAME-colors.tmpl` | `~/.tmux/scripts/<project_name>-colors.sh` | Catppuccin Mocha color palette (sourced by other scripts) |
| `dashboard/` | `<project_dir>/war-room-dashboard/` | Hono+Vite+WebSocket live web dashboard. Reads tmux state + per-CEO cost/context/messages/blockers. `bun install && bun run dev` → http://localhost:4200 |
| _(created)_ | `~/.<project_name>/` | Runtime state dir: `last.json` snapshot, `snapshots/`, `events.jsonl`, `messages/ceo-N.jsonl` |

## Placeholders

Three are substituted at install time:
- `{{PROJECT_NAME}}` → display name (e.g. `Acme`)
- `{{project_name}}` → command + slug (e.g. `acme`) — used in `SESSION=`, paths, filenames
- `{{PROJECT_NAME_UPPER}}` → all-caps banner strings (e.g. `ACME`)

## Re-install / update

Safe to re-run. Existing installs are overwritten in place; runtime state in
`~/.<project>/` is preserved.

```bash
cd <project_dir>
bash bin/install-war-room.sh <project_name> [PROJECT_NAME]
```

## Merge gate — `cmd_merge` in `bin/PROJECT_NAME.tmpl`

`{{project_name}} merge N` escalates through fast-forward, then no-ff auto-merge. Both land only
content that was already in the branch diff (plus, when main was behind, commits already on
`origin/main` — the same ground `bin/warroom`'s equivalent function covers, see its comments).
When neither applies cleanly — a real conflict — **the merge refuses**, explains why, and leaves
the conflict for a human to resolve on the branch.

That refusal used to be an "AI-assisted merge" tier instead: each conflicted file was piped to the
`claude` CLI's non-interactive print mode, its stdout was written straight back over the file,
committed, and the branch deleted — guarded only by a line-count cap and a grep for leftover
conflict markers. Nothing reviewed what the model produced, and the event log recorded it
`merge_complete` as though something had. Closed 2026-08-23 (branch `fix/template-merge-gate`).

**Why this doesn't carry `bin/warroom`'s QA-verdict gate.** `bin/warroom` (branch
`feat/gate-and-provenance-v2`) requires a verdict hash-bound to the branch diff — via
`scripts/verdict.mjs` — before tiers 1-2 even run, and refuses tier 3 outright because a conflict
resolution is content no diff any verdict could have hashed. That gate cannot be ported into this
template as-is:

- `BIN_DIR="$HOME/bin"` in the installed launcher (`bin/install-war-room.sh`), so the template's
  `_verdict_tool` lookup would resolve `$HOME/bin/../scripts/verdict.mjs` — a path in the
  installer's home directory, not the generated project's.
- `bin/install-war-room.sh` ships the launcher, the tmux helper scripts, the runtime state dir,
  and the dashboard — it does not ship `scripts/lib/classifier.js`, which `verdict.mjs` requires
  to run at all.

Making a generated project verdict-capable needs one launcher generation shared by `bin/warroom`
and this template — tracked as P1 in
[`docs/03-system-design/TARGET-ARCHITECTURE.md`](../docs/03-system-design/TARGET-ARCHITECTURE.md)
(§11 Sequence), which already notes `scripts/warroom-install.mjs` does a byte copy, not a render, so
this is unbudgeted build work rather than a small patch to either launcher. Refusing needs none of
that machinery, closes the same hole, and is what this template does now.
`npm run check:warroom` (via `scripts/warroom-template-guard.test.mjs`) fails if the
model-invocation route or the strategy-in-tier-field bug returns.

## Engine choice (`claude` / `codex`) — in `bin/warroom` only, deliberately

`bin/warroom` gained a per-pane engine on 2026-09-09: `--engine codex`, `--engine 2:codex`, and an
`engine:` key in `.warroom.yml`, so a Claude CEO and a Codex CEO can run in one session. **This
template did not get it, and a generated project therefore starts Claude in every pane** — which is
what it did before, so this is a capability that has not arrived, not a regression.

**This is a decision, not an omission.** Porting the ~180-line engine layer across would mean two
implementations of one thing, and the specific way they would disagree is the worst available: the
layer's whole job is to refuse an unknown engine rather than silently fall back to `claude`, and a
second copy that drifted would silently fall back to `claude`. Three concrete blockers, each
checkable in a second rather than taken on trust:

- **There is nowhere for `engine:` to live.** `grep -c '_cfg\|\.warroom\.yml' war-room/bin/PROJECT_NAME.tmpl`
  → **0**. This template predates config discovery entirely: `SESSION` and `PROJECT_DIR` are `sed`
  substitutions baked in at install time (lines 19-20). One of the three configuration sources the
  engine layer resolves through simply does not exist here, so the port is not a copy — it needs the
  config generation first.
- **It already holds a SECOND COPY of the CEO preamble.** `CEO_PREAMBLE` is inlined as a bash
  literal at line 57; `bin/warroom` reads `.claude/entry/ceo.md`. `render_ceo_preamble` exists
  precisely so the CEO's identity lives in ONE place and is rendered per engine. Porting it into a
  launcher that inlines its own copy would produce a *third* copy and defeat the property it
  implements.
- **Nothing keeps those two copies equal.** They are byte-identical today — both 2,931 bytes,
  verified 2026-09-09 — and that is discipline, not mechanism: no test compares them. Worth knowing
  on its own, and it is why "just sync the preamble too" is not the small change it sounds like.

**Same root cause, same tracked item as the merge gate above:** this needs the one shared launcher
generation that P1 in
[`docs/03-system-design/TARGET-ARCHITECTURE.md`](../docs/03-system-design/TARGET-ARCHITECTURE.md)
(§11 Sequence) already carries. Until that lands, `bin/warroom` is where the engine layer lives, and
this line is the notice a reader gets before they discover it from behaviour.

Measurements behind the engine layer — what Codex's instructions file is, how it is injected, and
what could not be measured — are in
[`docs/03-system-design/final-v2/research/codex-in-the-pane.md`](../docs/03-system-design/final-v2/research/codex-in-the-pane.md).

## Provenance

Templated from Beamix's live war-room stack on 2026-05-25. The Beamix-specific
versions remain at `~/bin/beamix`, `~/.tmux/scripts/beamix-*.sh`,
`~/.beamix/`, and `~/VibeCoding/Beamix/war-room-dashboard/` — those are the
live Beamix install, not the template. Edit them only for Beamix-specific
changes; merge generic improvements back into `war-room/` here.
