# Parts-Bin Census

Read-only inventory of what exists on disk today in this worktree
(`/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-1-1788261466`), taken to check a prior
document's part-by-part fate assignments against reality. `ls`, `find`, `wc`, `grep` only —
nothing executed, nothing written except this file.

| # | Part | Path | Exists | Count / size | Command used |
|---|------|------|--------|---------------|--------------|
| 1 | Ledger script | `scripts/ledger.mjs` | EXISTS | 78,014 bytes | `ls -la scripts/ledger.mjs` |
| 1 | Ledger data dir | `.claude/ledger/` | EXISTS | 1 file (`index.json`, 33,442 bytes) | `find .claude/ledger -type f \| wc -l` |
| 1 | Verdict script | `scripts/verdict.mjs` | EXISTS | 26,005 bytes | `ls -la scripts/verdict.mjs` |
| 1 | Produce-verdict script | `scripts/produce-verdict.mjs` | EXISTS | 59,983 bytes | `ls -la scripts/produce-verdict.mjs` |
| 1 | QA verdict records | `.qa/verdicts/` | EXISTS | 68 `.json` files | `find .qa/verdicts -type f \| wc -l` (confirmed via `ls .qa/verdicts/*.json \| wc -l`) |
| 2 | Check runner | `scripts/run-checks.mjs` | EXISTS | 15,883 bytes | `ls -la scripts/run-checks.mjs` |
| 2 | Check-suite step list | `scripts/lib/check-suite.js` | EXISTS | 121,407 bytes; **48** entries in the `STEPS` array | `awk '/^const STEPS = \[/{flag=1;next} flag && /^\];/{flag=0} flag' scripts/lib/check-suite.js \| grep -c "^\s*'"` |
| 2 | Citation checker | `scripts/check-citations.mjs` | EXISTS | 49,614 bytes | `ls -la scripts/check-citations.mjs` |
| 3 | QA tier-floor rules | `.claude/qa-tier-floor.yml` | EXISTS | 30,128 bytes | `ls -la .claude/qa-tier-floor.yml` |
| 3 | Risk classifier lib | `scripts/lib/classifier.js` | EXISTS | 7,755 bytes | `ls -la scripts/lib/classifier.js` |
| 3 | Classify CLI | `scripts/classify.mjs` | EXISTS | 3,196 bytes | `ls -la scripts/classify.mjs` |
| 3 | Gate declarations | `.claude/gates.yml` | EXISTS | 16,328 bytes | `ls -la .claude/gates.yml` |
| 3 | Gate checker | `scripts/check-gates.mjs` | EXISTS | 24,286 bytes | `ls -la scripts/check-gates.mjs` |
| 4 | Claude workflows dir | `.claude/workflows/` | EXISTS | 7 entries: `coding.js`, `design-screen.md`, `design.js`, `lib/` (dir), `qa.js`, `README.md`, `research.js` | `ls -la .claude/workflows/` |
| 4 | GitHub workflows dir | `.github/workflows/` | EXISTS | 3 files: `ci.yml`, `ledger-sweep.yml`, `qa-lead-pass.yml` | `ls -la .github/workflows/` |
| 5 | Agent definitions | `.claude/agents/*.md` | EXISTS | **18** files: `ai-engineer.md`, `builder.md`, `ceo.md`, `code-reviewer.md`, `database-engineer.md`, `design-lead.md`, `designer.md`, `framer.md`, `orchestrator.md`, `qa-lead.md`, `research-lead.md`, `researcher.md`, `reviewer-readonly.md`, `reviewer.md`, `security-engineer.md`, `sourcer.md`, `technical-writer.md`, `test-engineer.md` | `ls .claude/agents/*.md \| xargs -n1 basename` |
| 5 | Slash commands | `.claude/commands/*.md` | EXISTS | **16** files: `audit.md`, `board-meeting.md`, `build.md`, `color.md`, `daily.md`, `debug.md`, `design.md`, `fix.md`, `launch.md`, `name.md`, `plan.md`, `price.md`, `research.md`, `review.md`, `ship.md`, `validate.md` | `ls .claude/commands/*.md \| xargs -n1 basename` |
| 6 | Playbooks | `.claude/playbooks/` | EXISTS | 6 files: `design-pass.yml`, `launch-landing-page.yml`, `price-a-product.yml`, `research-question.yml`, `ship-feature.yml`, `validate-a-market.yml` | `ls .claude/playbooks/*.yml \| xargs -n1 basename` |
| 6 | Domain lenses | `.claude/lenses.yml` | EXISTS | 12,037 bytes | `ls -la .claude/lenses.yml` |
| 6 | Review lenses | `.claude/review-lenses.yml` | EXISTS | 12,653 bytes | `ls -la .claude/review-lenses.yml` |
| 7 | Skills | `.claude/skills/` | EXISTS | **134** `SKILL.md` files | `find .claude/skills -name "SKILL.md" \| wc -l` |
| 7 | Curation record | `.claude/skills/CURATION.yml` | EXISTS | 26,088 bytes | `ls -la .claude/skills/CURATION.yml` |
| 7 | Skills manifest | `.claude/skills/MANIFEST.json` | EXISTS | found via `find` | `find .claude/skills -name "MANIFEST.json"` |
| 7 | Router index | `.claude/skills/routers/INDEX.md` | EXISTS | 1,539 bytes | `ls -la .claude/skills/routers/INDEX.md` |
| 8 | Hooks dir | `.claude/hooks/` | EXISTS | 8 files: `budget-guard.js`, `gsa-check-update.js`, `gsa-context-monitor.js`, `gsa-statusline.js`, `pre-tool-use.sh`, `schema-lint.js`, `session-start.js`, `stop.sh` | `ls -la .claude/hooks/` |
| 8 | Sandbox setting | `.claude/settings.json` | EXISTS | contains `"sandbox": {` (line 78) and `"enabled": true,` (line 79) | `grep -n "sandbox" .claude/settings.json`; `grep -n '"enabled": true' .claude/settings.json` |
| 9 | Memory dir | `.claude/memory/` | EXISTS | 6 files — `CODEBASE-MAP.md` 15,218 B; `DECISIONS_ARCHIVE_002.md` 22,688 B; `DECISIONS_ARCHIVE.md` 34,472 B; `DECISIONS.md` 39,170 B; `LONG-TERM.md` 7,314 B; `USER-INSIGHTS.md` 719 B | `ls -la .claude/memory/`; `wc -c .claude/memory/*.md` |
| 10 | Session logs | `docs/08-agents_work/sessions/` | EXISTS | 175 `.md` files | `find docs/08-agents_work/sessions -name "*.md" \| wc -l` |
| 10 | Handoff docs | `docs/08-agents_work/handoffs/` | EXISTS | 18 `.md` files | `find docs/08-agents_work/handoffs -name "*.md" \| wc -l` |
| 11 | Mission Control app | `mission-control/` | EXISTS | 42 `.ts` files; top level: `bun.lock`, `check.mjs`, `client/`, `package.json`, `README.md`, `scripts/`, `server/`, `test/`, `tsconfig.json` | `find mission-control -name "*.ts" \| wc -l`; `ls mission-control/` |
| 11 | War Room app | `war-room/` | EXISTS | top level: `bin/`, `dashboard/`, `README.md`, `tmux/` (no `warroom` launcher inside `war-room/bin/`; see below) | `ls -la war-room/` |
| 11 | Launcher `bin/warroom` | `bin/warroom` | EXISTS | 3,429 lines — note: lives at repo-root `bin/warroom`, **not** `war-room/bin/warroom` (that path does not exist; `war-room/bin/` instead holds `PROJECT_NAME.tmpl`, `PROJECT_NAME.tmpl.bak.*`, `fleet-install.mjs`, `init-from-template.sh`, `install-war-room.sh`, `install.js`, `warroom`) | `wc -l bin/warroom`; `ls war-room/bin/` |
| 12 | MCP config | `.mcp.json` | EXISTS | 245 bytes; `mcpServers` keys: `playwright`, `claim-append` | `ls -la .mcp.json`; `grep -n -A20 "mcpServers" .mcp.json` |
| 12 | MCP policy | `.claude/mcp-policy.json` | EXISTS | 6,837 bytes | `ls -la .claude/mcp-policy.json` |
| 13 | Startup-OS doc | `docs/03-system-design/STARTUP-OS.md` | EXISTS | 240,298 bytes | `ls -la docs/03-system-design/STARTUP-OS.md` |
| 13 | Competitive expansion | `docs/02-competitive/expansion/` | EXISTS | 4 files: `00-TERRITORY.md`, `concepts.md`, `hands.md`, `open-source.md` | `ls -la docs/02-competitive/expansion/` |
| 13 | Competitive reference systems | `docs/02-competitive/reference-systems/` | EXISTS | 5 files: `cast.md`, `gsd.md`, `loops.md`, `metaswarm.md`, `omnigent.md` | `ls -la docs/02-competitive/reference-systems/` |
| 14 | Claude Code transcripts | `~/.claude/projects/**/*.jsonl` | EXISTS (readable) | 59 `.jsonl` files | `find /Users/adamks/.claude/projects -maxdepth 2 -name '*.jsonl' \| wc -l` |
| 15 | Harness home dir | `~/.agentvibe/` | EXISTS | top level (115 entries total): `events.jsonl` (1,112,541 B), `fake-home-probe/`, `last.json`, `messages/`, `mission-control/`, `node-compile-cache/`, several `pre-tool-use-events-*` dirs, `probe-readonly-test-*` dirs, `probes/`, `ptu-fixture-probe/`, `reader-stamp.json`, `snapshots/`, several `tier-gate-*` dirs, `usage-cache.json` | `ls -la /Users/adamks/.agentvibe/` |

## Surprises

- **`bin/warroom` is not where the prior document's item 11 phrasing implies.** The task asked to
  check "war-room/ or bin/warroom" — the launcher exists, but at the repo-root `bin/warroom`
  (3,429 lines), not inside `war-room/bin/`. `war-room/bin/` is a real, populated directory but
  holds install/template scripts (`install-war-room.sh`, `install.js`, `fleet-install.mjs`,
  `PROJECT_NAME.tmpl`), plus its own file literally named `warroom` (not checked for line count —
  out of scope) that is a different file from the root-level launcher. Two things named
  "warroom" exist in two different locations; do not conflate them.
- **Every one of the 33 checked parts EXISTS.** Nothing in this list came back MISSING. If the
  source document assigned a "does not exist" / "never built" fate to any of these paths, that
  fate is stale as of this census (2026-09-03).
- **STEPS count matches CLAUDE.md's own claim.** `scripts/lib/check-suite.js` has exactly 48
  entries in its `STEPS` array, consistent with the "48 steps" figure already asserted in the
  project's `CLAUDE.md` Project State section — no drift found here.
- **Agent file count (18) also matches CLAUDE.md's claim** of "7 engines of 18 files," including
  the 11 shim files (`ai-engineer`, `ceo`, `code-reviewer`, `database-engineer`, `design-lead`,
  `qa-lead`, `research-lead`, `researcher`, `security-engineer`, `technical-writer`,
  `test-engineer`) alongside the 7 real engines (`builder`, `designer`, `framer`, `orchestrator`,
  `reviewer`, `reviewer-readonly`, `sourcer`).
- **`.qa/verdicts/` holds 68 files**, not the 50 or 23 figures cited at various points in
  `CLAUDE.md`'s Project State history — this is a plain file count from this worktree today and
  should be treated as the current number, not reconciled against those superseded figures here.
- **`.mcp.json` shows exactly 2 `mcpServers` keys** (`playwright`, `claim-append`), matching
  CLAUDE.md's claim that "designer granted [playwright], and sourcer granted [claim-append]."
