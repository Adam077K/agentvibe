# Agentvibe v2 — the agentic company system (replaces S1.1)

**Summary.** v2 is a small operating system for one owner running several ventures and projects from one Mac on two subscriptions: Claude Code builds and Codex reviews. It keeps this repo's harness (7 engines, QA gate, claim ledger, lenses, playbooks, skills, sandbox) and adds one missing layer: a **runner**. The runner is a host process with a SQLite queue that creates worktrees, launches engines by argv, and **decides each job's status itself**: a diff exists, a frozen done-test passes in a clean checkout, and the harness loaded. The founder's view is a Monday page, a capped daily inbox and push alerts only for real emergencies. Memory is markdown in git plus the claim ledger and SQLite search. Each venture is its own repo and cannot read another's. Legal, finance, support and self-improvement stay dormant until named triggers. The build is ~30 small jobs, starting with a thin end-to-end path, and ends with one integrated test seeded with 11 failure classes. **The system is accepted when a real venture reaches Problem-validated through it.**

| File | What it answers |
|---|---|
| [01-VISION.md](01-VISION.md) | Who it serves, the venture life cycle, the founder's week, the numbers |
| [02-ARCHITECTURE.md](02-ARCHITECTURE.md) | Layers, agents, runner and envelope, memory, skills/MCP, improvement loop, approvals, subscriptions, isolation, the 12 failure modes |
| [03-COMPONENTS.md](03-COMPONENTS.md) | Every component: ADOPT / ADAPT / LEARN / BUILD, tool, licence, when |
| [04-KEEP-CUT.md](04-KEEP-CUT.md) | S1.1 C01–C09, AD-001…022, B00–B11, CAP-01…46: kept, simplified, deferred, dropped |
| [05-BUILD-PLAN.md](05-BUILD-PLAN.md) | J00–J29 + M1, with done-tests, lanes, the build gate policy and the integrated test |
| [06-METRICS.md](06-METRICS.md) | Success targets and drift alarms |
| [07-FOUNDER-DECISIONS.md](07-FOUNDER-DECISIONS.md) | 12 questions with recommendations; D12, D1, D2, D9 first |
| [08-RISKS.md](08-RISKS.md) | 14 surviving risks with mitigation and owner |

Inputs: [BRIEF.md](BRIEF.md), [panel/](panel/) (01–07c, 08 red team). Written 2026-09-29, one pass, single model family (see R14).
