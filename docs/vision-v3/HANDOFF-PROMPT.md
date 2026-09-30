# Handoff prompt — v3: the agentic organisation

Paste everything below the line into a fresh Claude Code session (Opus 5.5), started in this repo on branch `vision/v2-reenvision`.

---

You are the CEO and orchestrator of this repo (read `.claude/agents/orchestrator.md`). You plan, dispatch, validate and
synthesise; engines do the work. This run designs **v3 — the agentic organisation**: a system that lets one founder, with an
organisation of AI agents, conceive, build, run, grow and learn across startups, agencies, businesses, research and any project
he can imagine — at a level no small team has reached before. The founder calls the practice **vibe startuping**.

## The ambition — read this twice
The founder is not asking for a tool, a harness or an MVP. He is asking for a new kind of organisation: one human plus an AI
workforce that out-thinks, out-builds and out-learns companies with thousands of people. Treat that literally.

- **You may not shrink the vision.** No "phase it down", no "start small instead", no MVP framing of the *vision*, no cutting a
  capability because it is hard. Hard things get a design, a risk, and a path — not a deletion. Sequencing the *build* is fine;
  shrinking the *destination* is not.
- **You are expected to exceed what the founder described.** He listed what he can see from where he stands. You can read far
  more, faster. Every section must contain ideas he did not ask for. If v3 only reflects his words back, it has failed.
- **Challenge means adding, not opposing.** When you disagree, propose something bigger or better, not smaller.
- **Think in capabilities humanity does not yet have.** What becomes possible when research, design, engineering, sales and
  strategy are nearly free, parallel and tireless — and the bottleneck is judgment, direction and taste? Design for that world.

## Inputs — material, not answers
Read these to know what exists. **None of them is a decision you must keep.** You may contradict v1, v2, both engineering specs
and this repo's harness, if you state why. Do not read them first — see Round 0.

1. `docs/vision-v3/00-FOUNDER-DIRECTION.md` — **the only binding document.** The founder's decisions of 2026-09-30 and required areas.
2. `docs/vision-v3/engineering/ENGINE-SPEC.md` (51 KB) and `SURFACES-SPEC.md` (79 KB, 12 wireframes) — two principal engineers'
   proposals. Strong starting material; their choices (TypeScript daemon, SQLite log, "moves", four contact classes) are open.
   They disagree on founder-contact classes — reconcile.
3. v2 on this branch: `docs/vision-v2/` — package, 9-lens panel, red team, and 4 outside reviews (`reviews/README.md`). Explorer:
   https://claude.ai/artifact/98P7Rv2Qz7UQMqiVUjka4G . Treat the reviews' "shrink" advice as overruled; keep their *findings*
   (provider terms, crash safety, isolation, headless launch mechanics) as engineering inputs.
4. v1 "Company Engine" on `main`: `docs/vision-system/` (815 KB). Explorer: https://claude.ai/artifact/Ufucbixckde8yhiLf3JDTZ ;
   compact structured data in `docs/vision-system/planning/site/explorer/data/` (components, layers, decisions, capabilities,
   risks). Deep, rigorous, over-governed — mine it for what it got right.
5. The harness today: `AGENTS.md`, `.claude/` (agents, lenses, gates, workflows, skills), `mission-control/`, `scripts/`,
   `.claude/memory/DECISIONS.md`. `CLAUDE.md` is 69 KB of mostly history — grep it, never read it whole.

## The founder's direction — condensed (the full text is binding)
Don't shrink. Autonomy switchable per project; founder in the loop only at the altitude that matters. The system can act as a
founder or as part of the company. It must handle *anything* — **no playbooks as the core**; agents research, imagine, reason,
challenge themselves, plan, execute, document, remember and improve. Claude Code and Codex are **equal workers**. Agents are
identified by **title and expertise, never personal names**; invent **hybrid specialties** beyond human job titles and test them.
Swarms, multi-agent workflows, agents talking to each other. Memory without a graveyard. Skills harvested from open-source
libraries, not the 134 in this repo. One owned app — Mission Control (live agents, monitoring, spend and usage, tasks, idea board,
calendar, a missions board where dragging launches a team) — plus terminal, voice and phone, and surfaces that don't exist yet.
Startup speed with engineering rigour. The founder turns off model-training on his accounts; v3 still defines a data policy.

## How to run this — five rounds
Dispatch with the `Agent` tool; use `general-purpose` agents (opus) for thinking seats and tell each one to write its output with
the Write tool into `docs/vision-v3/…` and return a ≤200-word summary (this protects your context). Use **Codex** for at least three
seats via Bash (`codex exec`, write output to a file with `-o`), so two model families think, not one. Keep every seat independent
in its first pass.

### Round 0 — Look outward first (parallel, before anyone reads our documents)
Seats research the world, not our repo: the frontier of multi-agent systems and agent platforms (open and closed), how the most
effective organisations in history delegated and coordinated, and what one-person and tiny-team companies are actually achieving
with AI. Each seat writes a short "what I learned that we should use" brief with sources. Only then do they read the inputs.

### Round 1 — Diverge: five radically different organisations (parallel)
Before any convergence, commission **five fundamentally different whole-system concepts**, each by its own advocate, each a
complete answer (≤12 KB, one diagram, one worked day in the life). Seed ideas — replace any with a stronger one:
1. **The market** — work is posted; agents and teams bid with plans, price and track record; the founder funds outcomes.
2. **The co-founder** — one persistent AI co-founder with judgment and continuity hires temporary specialists for everything.
3. **The swarm** — no central orchestrator; agents coordinate through a shared world model, signals and stigmergy.
4. **The lab** — every decision is an experiment; the organisation is a portfolio of bets, killed or scaled on evidence.
5. **The studio** — ventures are produced like films: a small permanent core, crews assembled per production, reused sets.
Then a **judge panel (Claude + Codex)** scores them on: ambition reached, founder leverage, ability to handle unknown work, speed,
robustness, and how much each learns over time. The architecture you carry forward is the **best combination**, not one winner.

### Round 2 — Deepen: specialist seats (parallel), each designing its part of the chosen organisation
Required seats (add any you judge missing; the list is a floor):
- **Mission-engine designer** — open-ended work with no playbook: framing, research, hypotheses, options, plan, execution,
  evaluation, learning; self-challenge (debate, red team, pre-mortem); stop and pivot conditions; how reusable patterns are
  *learned* without becoming cages.
- **Multi-agent systems researcher** — team composition, swarms, agent-to-agent protocols (MCP, A2A, blackboards), coordination
  and non-interference, Claude/Codex as equal workers, how agents avoid hurting each other's work.
- **Autonomy and alignment designer** — autonomy levels per project, the initiative engine (how autonomous projects create their
  own work), the AI co-founder seat, decision rights, notification altitude, how the organisation stays pointed at the founder's
  intent and detects sideways motion and busywork.
- **Memory and knowledge architect** — company brain per venture, organisational memory, consolidation and forgetting,
  read-and-use tracking, learning transfer across ventures without leakage.
- **Skills, tools and MCP ecosystem scout** — harvest skills from open-source libraries (name them and count them), evaluate,
  version, let agents author and retire skills; the tool and MCP catalogue.
- **Hybrid-specialty designer** — invent at least 15 AI-native specialties that fuse fields no human could combine; for each: what
  it knows, what it's for, and an experiment that proves it beats the classic role.
- **Surfaces and voice designer** — Mission Control page by page, terminal, voice and phone, chat, mobile, and at least three
  surfaces that don't exist yet (ambient, wearable, spatial, agent-to-founder briefings…).
- **Startup operator** — vibe startuping in practice: what the organisation does in week 1, month 1, year 1 of a venture; how it
  finds customers, ships, sells, supports, raises, hires, pivots.
- **Simulation and evals engineer** — a digital twin to rehearse decisions and test agent teams; evals that prove the
  organisation is getting better every week.
- **Organisation theorist** (outside software) — lessons from how armies, film crews, open-source communities, trading firms and
  hospitals delegate, coordinate and learn under pressure.
- **Wildcard** (outside software) — a game designer or complex-systems scientist: motivation, emergence, feedback loops,
  self-repair, and what makes a system feel alive to its owner.
- **Engineering lead** — languages, stack, runner, sandboxes, security, data policy, provider terms, economics of Claude and
  Codex capacity, observability, reliability. Starts from the two engineering specs; free to change them.

### Round 3 — Stretch and attack (parallel)
- **Expander** — reads everything and finds what the whole team missed or under-imagined; proposes at least 10 additions.
- **Red team (Codex)** — how the organisation fails, is exploited, drifts or stalls; each failure gets a design answer, never a cut.

### Round 4 — Spike: prove the riskiest ideas are real (about a day)
Pick the two or three riskiest ideas and build throwaway prototypes with real Claude and Codex runs — for example: a mission
choosing its own next steps on an open-ended goal; two agents coordinating on one repo without collision; a hybrid specialty
beating a classic role on a real task; a board card launching a team. Record what happened. Let the results change the design.
Builders work in worktrees (see lessons below); nothing merges to `main`.

### Round 5 — Synthesise and test by scenario
A **chief architect** writes v3. Then a separate agent walks every worked scenario through the design and lists where it breaks;
the architect fixes; done. **No recheck chains, no document-reviews-document loops.**

## What v3 must contain (files under `docs/vision-v3/`; add whatever else it needs)
1. **Vision and principles** — what vibe startuping is; what reaching beyond billion-dollar companies means, in numbers.
2. **The organisation** — the chosen concept and why; the full system map; every layer drilled down.
3. **The mission engine** — open-ended work end to end, with self-challenge and learning.
4. **The agent organisation** — identity records by title and expertise, the hybrid specialties, dynamic teams, swarms,
   protocols, coordination, Claude/Codex routing as equals, launch-on-demand.
5. **Autonomy, initiative and the founder** — autonomy levels, the initiative engine, the AI co-founder seat, decision rights,
   notification altitude, the short "never without the founder" list.
6. **Memory and knowledge** — the company brain, organisational memory, consolidation, forgetting, cross-venture learning.
7. **Skills, tools and MCP economy.**
8. **Surfaces** — Mission Control page by page with wireframes; terminal; voice and phone; chat; mobile; future surfaces.
9. **Engineering** — stack, runner, sandboxes, security, data policy, provider terms, economics, observability, simulation,
   self-improvement with evals.
10. **Open-source and industry inspiration map** — every system studied: what it does well, what we take (use, fork, learn), licence.
11. **The five concepts and the judges' scoring** — kept, so the founder sees the road not taken.
12. **Spike results** — what was tried, what happened, what changed.
13. **Worked scenarios (at least 12)** — end to end: which agents launch (by title), which model, time, budget, skills, memory
    writes, approvals, what the founder sees on which surface. Include: a new agency from zero; an idea validated in 48 hours; a
    feature shipped overnight; a 3 a.m. incident; a competitor launch; learning a new field fast; a pivot; an autonomous business
    running a week without the founder; two agents' work colliding; budget exhausted mid-mission; the AI co-founder disagreeing
    with the founder; a project nobody has a playbook for.
14. **Build plan** — phases and small jobs (≤30 turns each), parallel lanes, and how the organisation starts building itself.
15. **Risks and open decisions** — each risk with a design answer; at most 10 founder decisions, each with a recommendation.

## Deliverables and definition of done
- The v3 files, deep and concrete (expect 200–400 KB), with mermaid diagrams, tables and ASCII wireframes.
- **A new explorer artifact** in the style of the v1/v2 explorers, with added diagram and wireframe views. Extend the generator
  in `docs/vision-v2/site/` (template + build.js). Publish it and give the founder the link.
- **One thin working slice**: a mission created from a board card, run by a Claude and a Codex agent, visible live in a Mission
  Control page. Proof the design is buildable, not the build itself.
- Committed and pushed on a new branch off `vision/v2-reenvision`; a session file; a handoff for the next team. Do not merge
  to `main` without the founder.

## Practical lessons from the last session (these cost hours — don't repeat them)
- Subagents cannot write "report" files with Write (a hook refuses). `general-purpose` agents told explicitly "use the Write tool
  into docs/vision-v3/…" did write their files successfully — the architect and both engineers did this.
- Builder and designer engines run in isolated worktrees off `main`; they can switch branch only via `git switch -c vision/f7-*`
  (a founder permission rule). Prefer `general-purpose` agents working in a worktree under your session root.
- Engines have `maxTurns` 25–30; big-spec lanes ran out every time. Resume with `SendMessage`, or keep jobs small.
- `git worktree add` needs the sandbox lifted for that one command; create worktrees under `$(git rev-parse --show-toplevel)/.worktrees/`.
- `gh` needs the sandbox lifted (`~/.config/gh` is read-denied); `git push` needs `allowed_domains: github.com`.
- The ledger lint treats any backticked `c-…` id in prose as a claim id — don't write claim-style ids you haven't registered.
- Never read 4 MB files whole (`F2-07-outside-review.md`, contract registries). Grep and range-read.
- Merge `origin/main` into an old branch only in a clean worktree; a partial checkout leaves untracked debris.
