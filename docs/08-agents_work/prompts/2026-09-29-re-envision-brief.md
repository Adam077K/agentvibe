# Re-envision brief — the startup agent system, v2 (DRAFT for founder review)

## Mission
Re-envision the full system: an agentic, multi-agent, self-improving operating system that lets a
founder and a very small team (1–3 people) build and run startups at the speed and quality of a
billion-dollar company. Keep the best of the existing plan (S1.1), cut what a small fast team does
not need yet, and adopt existing open-source and free tools wherever they exist. Output is a
**build-ready** v2, not another essay.

## Scope: everything
The re-envisioning covers the WHOLE system, not only the constraints below. Every panelist must
consider, from its lens:
- **Company lifecycle:** idea → discovery → validation → build → launch → grow → operate → finance →
  legal/admin → hire/partner → pause/close, and running several ventures at once (portfolio).
- **The agent organisation:** roles vs temporary workers, swarms, hierarchy vs flat, routing,
  delegation, parallelism, how agents hand off, how humans fit in.
- **The founder:** what they decide, approve, see and never see; daily and weekly rhythm; attention budget.
- **Knowledge and memory:** short/long-term memory, company knowledge base, customer insight, context
  delivery, forgetting, provenance.
- **Capabilities:** skills library, MCP servers, tools, integrations, where each comes from and how new
  ones are added.
- **Learning:** self-improvement, evaluation, experiments, how the system gets better each week
  without drifting or breaking.
- **Quality and trust:** review, QA gates, testing, evidence, what is autonomous vs approved.
- **Lean loop:** build-measure-learn, customer contact, analytics, pivot/persevere decisions.
- **Go-to-market, sales, support, finance, legal:** run by agents where possible.
- **Operations:** security, cost and subscription budget, reliability, recovery, observability, interfaces.
- **Anything S1.1 or this brief missed** — naming it is part of the job.

## Non-negotiables (founder, 2026-09-29)
1. **Do not reinvent the wheel.** Every component is ADOPT (existing open-source/free tool), ADAPT
   (fork or wrap one) or BUILD — and BUILD needs a written reason why no existing tool fits.
2. **Model work runs on the founder's personal subscriptions** (Claude Code, Codex). Design within
   their real limits: concurrency, rate limits, session length, CLI updates, provider terms.
3. **Startup-grade first.** Minimum viable safety now; heavier controls are named as later upgrades
   with the trigger that activates each (first customer, first payment, first employee).
4. **Small jobs.** Every build unit must be finishable by one agent in one session (≤30 turns,
   ≤~50 files read). If a unit cannot be, split it.
5. **Build fast end-to-end, then test.** No early comparison gate; one integrated test at the end.
6. **Reuse this repository's harness** (7 engines, QA gate, claim ledger, lenses, playbooks,
   134 skills, sandbox) as the foundation. Replace a part only with a stated reason.

## Read first (by reference — do not read the 72 MB package whole)
- The founder directive: `docs/vision-system/inputs/DIRECTIVE.md`
- What the system is: `docs/vision-system/planning/00-executive-guide.md`, `01-understand.md`,
  `02-architecture-selection.md` (heading map, then the sections you need)
- What an outside reviewer found: `docs/vision-system/planning/reviews/F2-07-outside-review.md`
  (grep only: executive assessment, founder decision packet, minimum first release)
- Research already done: `docs/vision-system/research/L01…L14-*.md` (read the lane for your role)
- The harness today: `CLAUDE.md`, `AGENTS.md`, `.claude/lenses.yml`, `.claude/playbooks/`
- Weak points already found: `docs/08-agents_work/handoffs/2026-09-28-return-state-and-path.md`

## The panel (one pass each, independent, no peeking at each other in round 1)
| # | Role | Lens it owns | Model |
|---|---|---|---|
| 1 | Serial founder, lean-startup practitioner | Build-measure-learn loop, customer discovery by agents, what to cut | sonnet |
| 2 | Staff engineer, multi-agent systems | Orchestration, agent roles vs temporary workers, MCP, skills, Agent SDK/CLI limits | opus |
| 3 | Open-source scout (web research) | Landscape of frameworks/tools per component, licence, maturity, fit — with URLs and dates | sonnet |
| 4 | Memory and self-improvement researcher | Memory layers, context delivery, evals, how the system learns without drifting | opus |
| 5 | Solo-founder experience designer | Founder attention budget, approvals, daily/weekly rhythm, interfaces | sonnet |
| 6 | Growth and GTM operator | Marketing, sales, content, SEO, launches run by agents | sonnet |
| 7 | Pragmatic ops, security and cost lead | Minimum viable safety, secrets, permissions, subscription and token budget | sonnet |
| 7b | Customer, support and operations operator | Onboarding, support, retention, service delivery run by agents | sonnet |
| 7c | Finance, legal and admin operator | Books, payments, pricing, contracts, compliance for a tiny company | sonnet |
| 8 | Red team (round 2 only) | How v2 fails: runaway loops, context overflow, subscription limits, bad autonomy | opus |
| 9 | Chief architect / synthesiser (round 3) | Merges into one v2; resolves conflicts; owns the output | opus |

Optional: run role 2 or 8 on Codex for a second model family.

## Each panelist returns (≤1,500 words, fixed shape)
1. Keep from S1.1 (with section refs) · 2. Cut or defer (with the trigger to bring it back) ·
3. Add (what S1.1 missed) · 4. ADOPT/ADAPT/BUILD table for its area, with named tools ·
5. Top 3 risks · 6. Open questions only the founder can answer.

## Process — one pass, timeboxed
Round 1 panel in parallel → Round 2 red team reads all seven → Round 3 synthesiser writes v2 →
founder decides. **No recheck chains.** Disagreements are resolved by the synthesiser and listed,
not re-reviewed.

## Deliverable: v2 package (≤60 KB total — S1.1 was 815 KB)
1. **Vision** (1 page): who it serves, what "compete with billion-dollar companies" means in numbers.
2. **Architecture** (≤5 pages): layers, agents, memory, MCP servers, skills, self-improvement loop,
   founder touchpoints, what runs where on which subscription.
3. **Component table**: every component with ADOPT/ADAPT/BUILD, tool, licence, cost, reason.
4. **Keep/cut ledger vs S1.1**: every S1.1 capability C01–C09 kept, simplified or deferred, with trigger.
5. **Build plan**: ordered small jobs (each ≤30 turns), dependencies, done-test per job, parallel lanes.
6. **Success metrics**: e.g. time to first shipped product, founder hours/week, cost per shipped
   feature, time to first paying customer.
7. **Founder decision list**: ≤10 questions, each with a recommendation.
8. **Red-team risks** that survived synthesis, with mitigation.

## Stop rules
Budget cap per run (agents × turns) fixed before launch. If the synthesiser needs more than one pass,
it ships with open issues listed rather than looping.
