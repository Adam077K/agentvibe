# AGENTS.md — Routing Table
*3-layer agent system: CEO → Team Leads → Workers*

---

## How to Route

**Always start with CEO.** The CEO reads memory, asks questions, and assembles the right team.

| Request type | Start here |
|-------------|-----------|
| Any task | CEO |
| Slash commands | `/build` `/fix` `/design` `/review` `/daily` `/plan` `/ship` `/audit` `/research` |

---

## Layer 1: CEO

| Agent | File | Job | Model |
|-------|------|-----|-------|
| **CEO** | `ceo.md` | Entry point for ALL tasks. Questions → team assembly → delegate → synthesize. | Opus 4.7 |

---

## Layer 2: C-suite

The C-suite is dispatched by CEO. Each owns one organizational domain end-to-end. The legacy 9-lead model was retired on 2026-05-16; build-lead/product-lead/growth-lead/business-lead folded into CTO/CPO/CMO/CBO. devops-lead/data-lead were demoted to -engineer workers under CTO.

| Agent | File | Domain | Model |
|-------|------|--------|-------|
| **CTO** | `cto.md` | All engineering: code, infra, architecture. Spawns engineering workers. | Opus 4.7 |
| **CPO** | `cpo.md` | Product: PRDs, roadmap, RICE, acceptance criteria, spec compliance. | Opus 4.7 |
| **CMO** | `cmo.md` | Growth: copy, SEO/GEO, email, GTM, CRO. Requires USER-INSIGHTS.md (hard gate). | Sonnet 4.6 |
| **CBO** | `cbo.md` | Business: pricing, financials, OKRs, unit econ, legal/compliance. Numbers first. | Sonnet 4.6 |
| **CCO** | `cco.md` | Customer: support, onboarding, retention, churn analysis, customer voice. | Sonnet 4.6 |
| **QA-Lead** | `qa-lead.md` | Independent quality gate. 4-tier risk classification, PASS/BLOCK verdict. Cannot be overridden. | Sonnet 4.6 (Opus on Full) |
| **Research-Lead** | `research-lead.md` | All research: competitive, market sizing, tech eval, user research. Reports to CEO directly. | Opus 4.7 |
| **Design-Lead** | `design-lead.md` | UI/UX: screens, components, design systems, design audits. Reports under CPO. | Sonnet 4.6 |

---

## Layer 3: Workers

Workers receive structured briefs from leads, create worktrees (for code), execute atomically, and return completion signals.

### New Worker Agents

| Agent | File | Job | Model |
|-------|------|-----|-------|
| **Backend Developer** | `backend-engineer.md` | API routes, server logic. TypeScript strict, Zod validation. Git worktrees. | Sonnet 4.6 |
| **Frontend Developer** | `frontend-engineer.md` | React components, Tailwind + Shadcn/UI. Pencil MCP for designs. Git worktrees. | Sonnet 4.6 |
| **Database Engineer** | `database-engineer.md` | Schema design, migrations, queries. Supabase MCP. Never drops without confirmation. | Sonnet 4.6 |
| **AI Engineer** | `ai-engineer.md` | LLM integration, RAG, embeddings. Every feature ships with eval + cost logging. | Opus 4.7 |
| **Security Engineer** | `security-engineer.md` | OWASP audit, injection testing, auth review, npm audit. Structured severity findings. | Opus 4.7 |
| **Test Engineer** | `test-engineer.md` | Unit, integration, E2E tests. Playwright MCP for browser tests. TDD from specs. | Haiku 4.5 |
| **Code Reviewer** | `code-reviewer.md` | Code quality, patterns, tech debt. P1/P2/P3 findings. Diff-scoped only. | Sonnet 4.6 |
| **Researcher** | `researcher.md` | Deep research on 1 specific question. Sources every claim. HIGH/MEDIUM/LOW confidence. | Opus 4.7 |
| **Technical Writer** | `technical-writer.md` | Documentation, READMEs, PR descriptions, API docs. | Sonnet 4.6 |

### GSD Execution Agents (Worker Backbone)

These agents are the execution backbone. Dispatched by leads for structured project work.

> **These files are not in this repo.** They resolve from the user-level agent directory
> (`~/.claude/agents/`), which the runtime searches in addition to `.claude/agents/`. They work on this
> machine and will be missing on a fresh clone or for a teammate. Vendoring them is a Phase 4 decision —
> until then, treat this table as a description of the local environment, not of the repository.

| Agent | File | Job |
|-------|------|-----|
| **GSD Executor** | `executor.md` | Executes PLAN.md files atomically with deviation handling and checkpoint protocols |
| **GSD Planner** | `planner.md` | Creates detailed phase plans with goal-backward methodology and dependency graphs |
| **GSD Debugger** | `debugger.md` | Root cause investigation using scientific method, persistent DEBUG.md state |
| **GSD Verifier** | `verifier.md` | Goal-backward verification: exists → substantive → wired (3-level check) |
| **GSD Roadmapper** | `roadmapper.md` | Project roadmap creation with requirement traceability and success criteria |
| **GSD Codebase Mapper** | `codebase-mapper.md` | Codebase exploration and documentation (STACK.md, ARCHITECTURE.md, etc.) |
| **GSD Integration Checker** | `integration-checker.md` | Cross-phase integration and E2E flow verification |
| **GSD Plan Checker** | `plan-checker.md` | Pre-execution plan quality gate (8 verification dimensions) |
| **GSD Phase Researcher** | `phase-researcher.md` | Phase-specific technology research (RESEARCH.md) |
| **GSD Project Researcher** | `project-researcher.md` | Domain ecosystem research before roadmap creation |
| **GSD Research Synthesizer** | `research-synthesizer.md` | Consolidates parallel research outputs into SUMMARY.md |
| **GSD Nyquist Auditor** | `nyquist-auditor.md` | Validation gap filling for Nyquist compliance |

---

## Routing Examples

Routing uses the current C-suite. The 9-lead model was retired on 2026-05-16 (see Layer 2 above);
`build-lead`, `product-lead`, `growth-lead` and `business-lead` folded into CTO/CPO/CMO/CBO, and
`devops-lead`/`data-lead` became `-engineer` workers under CTO.

| What you need | Who handles it |
|--------------|----------------|
| "Build a new feature" | CEO → CTO → backend-engineer + frontend-engineer |
| "Research competitors" | CEO → Research-Lead → researcher (x2-3) |
| "Design a new screen" | CEO → Design-Lead → frontend-engineer |
| "Write copy for landing page" | CEO → CMO |
| "Decide on pricing" | CEO → CBO |
| "Write a PRD for new feature" | CEO → CPO |
| "Deploy to production" | CEO → CTO → devops-engineer (needs QA-Lead PASS first) |
| "Analyze our SQL queries" | CEO → CTO → data-engineer |
| "Fix a bug" | CEO → CTO → backend-engineer / frontend-engineer |
| "Security audit" | CEO → QA-Lead → security-engineer |
| "Write tests for feature" | CEO → CTO → test-engineer |
| "Review my PR" | CEO → QA-Lead → code-reviewer + security-engineer |
| "New project from scratch" | CEO → CPO (spec) → CTO (build) |

---

## Memory Files

| File | Written by | Read by |
|------|-----------|---------|
| `.claude/memory/DECISIONS.md` | Any agent | CEO, all C-suite |
| `.claude/memory/CODEBASE-MAP.md` | code-reviewer | CTO, CEO |
| `.claude/memory/USER-INSIGHTS.md` | CMO, CPO | CMO, CPO, CEO |
| `.claude/memory/LONG-TERM.md` | CEO | CEO (every session) |
| `docs/08-agents_work/sessions/` | Each C-suite / Lead | CEO (for daily) |

There is no .claude/memory/specs/ directory. Specs live with the PRD under `docs/`.
