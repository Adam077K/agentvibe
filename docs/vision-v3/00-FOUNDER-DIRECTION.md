# Founder direction for v3 — 2026-09-30 (binding)

v3 is the full-depth plan of the system. Working name for the practice it enables: **vibe startuping** — one founder plus an
agentic organisation competing with billion-dollar companies. It supersedes the v2 reviews' "shrink the build" advice.

## What the founder decided (supersedes earlier answers where they conflict)
1. **Do not shrink the vision.** The full harness, agents, agentic use and autonomy stay. The reviews' concerns become
   design inputs, not scope cuts.
2. **Autonomy with the founder in the loop at the right altitude.** The system moves on its own; the founder sets direction,
   hears what is happening and why, and decides only what matters — never the small decisions. Find the sweet spot.
3. **Autonomy is a per-project switch.** 2–3 businesses/agencies (maybe one project) run autonomously; others are founder-driven.
4. **The system can act as a founder or as part of the company** — not only a tool the founder uses.
5. **It must handle anything:** startups, businesses, agencies, projects, learning, research, any idea. Most real work has no
   playbook. **No playbooks as the core** — they limit thinking. The system must reason, research, imagine, challenge itself,
   plan, execute, document, remember and improve on open-ended work.
6. **Claude Code and Codex are equal.** Both build, both review, both do any job. Not "Codex = reviewer only".
7. **Agents are identified by title and expertise, never personal names** (founder, 2026-09-30: "An engineer is a good enough title"). What matters is the role and the knowledge it carries.
   Agents are launched only when needed (an engineer is a Claude Code or Codex session with the right memory, context,
   sandbox and skills), not standing processes.
8. **Hybrid specialties.** Don't copy human job titles by default. AI makes it possible to fuse fields that no human could
   combine; design, test and compare such hybrid agents against classic roles.
9. **Swarms, multi-agent workflows, agents talking to each other** — use the modern patterns, deliberately.
10. **Memory without a graveyard.** Record what gets read and used; consolidate; forget; no write-only logs.
11. **Skills from scratch.** Do not anchor on the 134 curated skills. Harvest from open-source skill libraries and collections,
    find skills we don't yet know we need, and build an acquisition pipeline.
12. **Surfaces — one app we own, not outsourced:** a Mission Control centre (web/desktop) with pages for: live agents and what
    they are doing, monitoring their work, updates, spend and usage, tasks, an idea board / parking lot, a calendar with goals
    and missions, a board where dragging a mission from waiting → working → done launches the right team (Linear-like, but
    ours). Plus the terminal. Plus future surfaces: voice and phone calls as a reach point to the founder, and whatever comes next.
13. **Startup mindset plus engineering mindset** throughout: move fast, test, improve, adjust, pivot — engineered properly.
14. **Data-training settings** will be turned off by the founder (done by hand; the plan should still define a data policy).

## What v3 must also cover — areas the founder did not name (orchestrator expansion)
The founder asked the AI to see further. These are required sections, not optional:
- **The mission engine for open-ended work** — how an unspecified goal becomes research → hypotheses → options → a plan →
  execution → evaluation → learning, with self-challenge (debate, red team, pre-mortem) and explicit stop conditions.
- **Dynamic team composition** — who gets launched for a mission and why; team size; model choice (Claude/Codex/other);
  budget; sandbox; how the team is dissolved and what it leaves behind.
- **Agent identity system** — agents as records identified by title/expertise (skills + memory + tools + model + track record), hybrid-specialty
  design, and an experiment harness that compares them.
- **The initiative engine** — how autonomous projects generate their own work (standing goals, heartbeats, signals,
  opportunity scanning), and how that stays aligned with the founder's intent.
- **Alignment and progress** — goal trees, "are we closer?" checks, detecting sideways motion and busywork, kill/pivot logic.
- **Coordination and non-interference** — ownership, leases, merge queues, shared blackboard, conflict resolution, so agents
  don't hurt each other's work.
- **An AI co-founder seat** — what it owns, how it disagrees with the founder, its cadence (e.g. a weekly board meeting).
- **Company brain / world model per venture** — customers, market, competitors, metrics, decisions; shared lessons across
  ventures without leaking.
- **Skills and tools economy** — acquisition, evaluation, versioning, agents authoring new skills, retirement; MCP servers.
- **Economics** — subscription and token budgeting, cost per outcome, degraded modes when limits hit.
- **Human collaborators** — contractors, co-founders, customers and advisors inside the system with scoped access.
- **External world interfaces** — email, phone/voice, web, payments, social, ads, code hosting, deploys; approvals where
  consequential.
- **Observability and explainability** — timeline, traces, "why did it do that", replay.
- **Safety, data policy and provider terms** — what data flows where; outbound/terms compliance; kill switches.
- **Self-improvement** — how the organisation gets better every week, measured.
- **Simulation** — a sandbox "digital twin" to rehearse decisions and test agent teams before acting for real.
- **Onboarding** — a new project in minutes; importing the founder's ~19 existing repos.
- **Worked scenarios** — end-to-end walkthroughs showing what the system does, which agents launch, time, budget, skills,
  memory writes, approvals: e.g. start a new agency; validate an idea; ship a feature overnight; a 3 a.m. production incident;
  a competitor launches; learn a new field fast; a pivot decision; an autonomous business running a week without the founder.

## Inputs to read
- v1 (S1.1, the Company Engine): explorer https://claude.ai/artifact/Ufucbixckde8yhiLf3JDTZ ; data in
  `docs/vision-system/planning/site/explorer/data/`; spec in `docs/vision-system/planning/specification/`.
- v2: explorer https://claude.ai/artifact/98P7Rv2Qz7UQMqiVUjka4G ; `docs/vision-v2/` (package, panel, red team, 4 reviews).
- v3 engineering specs (written 2026-09-30): `docs/vision-v3/engineering/`.
- This repo's harness: `CLAUDE.md`, `AGENTS.md`, `.claude/`, `mission-control/`, `scripts/`.

## Decisions added 2026-09-30 (later)
1. **Model work runs on subscriptions only** (Claude Max; ChatGPT plans for Codex) — no metered API spend. The scarce resource
   is subscription **capacity** (5-hour window + weekly cap per account), measured from each tool's own readouts, never
   hard-coded. Near a limit: queue, use a lighter model, or switch family/account — never stop silently; when capacity is the
   bottleneck, say what another seat would add. Provider terms on automated use of consumer plans are a **flagged risk** (15).
2. **Prefer free tools and free tiers; buy when really needed.** Never serve a paying customer from a non-commercial free plan.
3. **Keep economics proportionate** — correct it, do not make it a main theme.
