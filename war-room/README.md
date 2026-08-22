# war-room/ — Multi-CEO tmux templates

Source of truth for the multi-CEO tmux war-room. Installed into a new project
by `bin/install-war-room.sh` (called from `bin/init-from-template.sh` or `~/bin/newproject`).

## What gets installed

| Template | Installed location | Purpose |
|---|---|---|
| `bin/PROJECT_NAME.tmpl` | `~/bin/<project_name>` | Main launcher (2768 LOC bash). Subcommands: `[N]`, `add`, `done N`, `kill`, `ls`, `task N "label"`, `grid`, `restore`, `--bare`, `send`, `broadcast`, `diff N`, `merge N`, `inbox`, `files`, `history`, `log`, `cost`, `events`, `brief`. |
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

## Provenance

Templated from Beamix's live war-room stack on 2026-05-25. The Beamix-specific
versions remain at `~/bin/beamix`, `~/.tmux/scripts/beamix-*.sh`,
`~/.beamix/`, and `~/VibeCoding/Beamix/war-room-dashboard/` — those are the
live Beamix install, not the template. Edit them only for Beamix-specific
changes; merge generic improvements back into `war-room/` here.
