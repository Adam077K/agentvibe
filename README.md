# GSA Startup Kit
*Autonomous C-suite agent system for Claude Code. Drop into a new repo, fill in placeholders, ship.*

> **2026-05-25 — re-baselined on the Beamix agent system.** This README, [CLAUDE.md](CLAUDE.md), and
> [AGENTS.md](AGENTS.md) describe that baseline. A rebuild is in progress — see
> [AGENT-SYSTEM-REBUILD.md](docs/03-system-design/AGENT-SYSTEM-REBUILD.md).

## What's inside

Counts below are verified by `npm run check:registration`, which fails the build when they drift.

| Layer | Path | Count |
|-------|------|-------|
| Agents (6 engines + 11 shims) | `.claude/agents/` | 17 `.md` |
| Skills (curated, on-demand, MANIFEST-indexed) | `.claude/skills/` | 98 |
| Hooks (pre-tool, stop, schema-lint, context monitor, statusline, update check, session-start, budget-guard) | `.claude/hooks/` | 8 |
| Slash commands | `.claude/commands/` | 13 |
| QA-tier auto-classifier (4 tiers: trivial → irreversible) | `.claude/qa-tier-floor.yml` | 1 |
| Permissions + hooks (no MCP grants — none are configured) | `.claude/settings.json` (+ `.proposed`) | 2 |
| Memory templates | `.claude/memory/{DECISIONS,LONG-TERM,USER-INSIGHTS,CODEBASE-MAP}.md` | 4 |
| CI workflows | `.github/workflows/` | 3 |

## 30-second pitch

- **Every task starts at the CEO.** The CEO asks questions, assembles the right C-suite, delegates, synthesizes one answer.
- **No merge without QA-Lead PASS.** 4-tier risk classification is auto-set by file-path patterns; the CEO and CTO cannot override.
- **Workers run in isolated git worktrees.** Atomic commits, structured JSON returns, no sneaky cross-scope edits.
- **Memory is explicit.** Decisions, codebase map, user insights, and long-term facts live in 4 versioned files with hard caps. No mystery context.
- **Models are routed deliberately.** Sonnet 4.6 default · Opus 4.7 for synthesis/design/orchestration · Haiku 4.5 for lint/lookup. Specified in every brief.

## First-run

1. Read [TEMPLATE-USAGE.md](TEMPLATE-USAGE.md) — placeholder list + replacement script.
2. Fill in `CLAUDE.md` → Project State section.
3. Fill in `.claude/memory/LONG-TERM.md`.
4. Run `npm run check` — schema-lint, gate tests, and the registration check must pass.
5. Smoke-test:
   ```
   /name ceo-smoke-test
   /color gold
   "Read CLAUDE.md and tell me what's still a placeholder."
   ```

## Documentation

| File | What it covers |
|------|---------------|
| [CLAUDE.md](CLAUDE.md) | Auto-loaded every session — team, stack, memory, QA gate, layer contracts, rules. |
| [AGENTS.md](AGENTS.md) | Full routing table — who handles what, model assignments. |
| [TEMPLATE-USAGE.md](TEMPLATE-USAGE.md) | Placeholder list, first-run checklist, smoke test. |
| [SKILLS_SOURCE.md](SKILLS_SOURCE.md) | Skill library provenance (preserved from prior kit). |
| [AGENT-SYSTEM-REBUILD.md](docs/03-system-design/AGENT-SYSTEM-REBUILD.md) | The in-progress rebuild: design, phases, and gates. |

## License

MIT — see [LICENSE](LICENSE).
