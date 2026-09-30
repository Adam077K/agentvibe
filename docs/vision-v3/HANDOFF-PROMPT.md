# Handoff prompt — build the v3 plan of the agentic company system

Paste everything below the line into a fresh Claude Code session (Opus 5.5) started in this repo as the CEO/orchestrator.

---

You are the CEO and orchestrator (read `.claude/agents/orchestrator.md`). You never write product code; you plan, dispatch,
validate and synthesise. This run produces **v3: the full, deep plan of the agentic company system** — the thing that lets one
founder plus an AI organisation build, run and grow startups, agencies, businesses, projects and learning at the level of a
billion-dollar company. The founder calls the practice **vibe startuping**.

## Where things stand (read these first, in this order)
1. `docs/vision-v3/00-FOUNDER-DIRECTION.md` — **binding.** The founder's decisions of 2026-09-30 and the required expansion areas.
2. `docs/vision-v3/engineering/ENGINE-SPEC.md` and `SURFACES-SPEC.md` — two principal engineers' specs (languages, tools,
   OSS, layers, runner, memory, skills, autonomy; Mission Control pages with wireframes, voice, terminal).
3. v2 (branch `vision/v2-reenvision`, `docs/vision-v2/`): package, 9-lens panel, red team, 4 outside reviews
   (`reviews/README.md` has the synthesis and 8 must-fix findings). Explorer: https://claude.ai/artifact/98P7Rv2Qz7UQMqiVUjka4G
4. v1 / S1.1 "Company Engine" (on `main`, `docs/vision-system/`): 815 KB spec, 46 capabilities, 9 components, 22 decisions.
   Explorer: https://claude.ai/artifact/Ufucbixckde8yhiLf3JDTZ ; structured data in `docs/vision-system/planning/site/explorer/data/`.
5. The harness that exists today: `CLAUDE.md` (69 KB — read by grep, it is mostly history), `AGENTS.md`, `.claude/`,
   `mission-control/`, `scripts/`, `.claude/memory/DECISIONS.md`.
6. Session record: `docs/08-agents_work/handoffs/2026-09-28-return-state-and-path.md` (branch `ceo-1-1790613500`).

## What the founder wants — in his words, condensed
Don't shrink the vision. More autonomy, founder in the loop only where it matters. Autonomy switchable per project. The system
can act as a founder or part of the company. It must handle *anything* — no playbooks as the core; agents must research, imagine,
reason, challenge themselves, plan, execute, document, remember and improve. Claude Code and Codex are equal workers. Named agents
and **hybrid specialties** beyond human job titles (test them). Swarms and agents talking to each other. Memory without a
graveyard. Skills harvested from scratch from open-source libraries, not the 134 we have. One owned app: Mission Control with live
agents, monitoring, spend/usage, tasks, idea board, calendar, a missions board where dragging launches a team; plus terminal; plus
voice/phone and future surfaces. Startup speed plus engineering rigour. **Expand what he said — he asked the AI to see further.**

## Your job: the v3 plan, at v1's depth and with v2's speed
v1 was deep but took weeks of documents reviewing documents. v2 was fast but shallow and too cautious. v3 must be **deep, concrete,
visual and decisive**, and it is judged by worked scenarios, not by reviews of prose.

### Required sections (each a file under `docs/vision-v3/`, plus anything else you find missing)
1. **Vision and principles** — what vibe startuping is; what "compete with billion-dollar companies" means in numbers; principles.
2. **System map** — all layers and components on one diagram, then each drilled down.
3. **The mission engine** — open-ended work without playbooks: goal → research → hypotheses → options → plan → execute →
   evaluate → learn; self-challenge (debate, red team, pre-mortem, devil's advocate agents); stop conditions; how "unknown work" is
   decomposed; how playbook-like knowledge is *learned* as reusable patterns without becoming a cage.
4. **The agent organisation** — agent identity records, the named roster *and* hybrid specialties (propose at least 12 hybrids and
   how to test them against classic roles), dynamic team composition per mission, swarms, agent-to-agent protocols,
   coordination and non-interference, Claude/Codex routing as equals, launch-on-demand.
5. **Autonomy and the founder** — autonomy levels per project, the initiative engine, the AI co-founder seat (ownership, cadence,
   how it disagrees), notification altitude, decision rights, veto windows, the "never without the founder" list.
6. **Memory and knowledge** — layers, company brain per venture, consolidation and forgetting, read-tracking, cross-venture learning.
7. **Skills, tools and MCP economy** — acquisition from open-source libraries (name them), evaluation, versioning, agent-authored
   skills, retirement.
8. **Surfaces** — Mission Control page by page with wireframes, terminal, voice/phone, chat, mobile, future surfaces.
9. **Engineering** — languages, stack, repo layout, runner, sandboxes, security, data policy, provider terms, economics
   (subscription capacity for Claude + Codex), observability, simulation/digital twin, self-improvement with evals.
10. **Open-source inspiration map** — for each system studied: what it does well, what we take (use / fork / learn), licence.
11. **Worked scenarios (at least 10)** — end to end, minute by minute where it matters: which agents launch (by name), models,
    time, budget, skills, memory writes, approvals, what the founder sees on which surface. Include: new agency from zero;
    validate an idea in 48 h; overnight feature ship; 3 a.m. incident; competitor launch; learn a new field; pivot decision;
    autonomous business running a week without the founder; two agents' work colliding; budget exhausted mid-mission.
12. **Build plan** — phases and small jobs (≤30 turns each), what can run in parallel, and how the system starts building itself.
13. **Risks and open decisions** — with recommendations; keep the founder decision list short.

### Deliverables
- The files above, total roughly 150–300 KB, with mermaid diagrams, tables and ASCII wireframes.
- A **new explorer artifact** in the style of the v1/v2 explorers, adding wireframe and diagram views. The v2 generator is in
  `docs/vision-v2/site/` (template + build.js); extend it. Publish it and give the founder the link.
- A session file and a handoff for the team after you.

### Process — how to avoid the v1 trap
- Round 1: dispatch 6–9 independent specialists in parallel (research the web first, then read the inputs). Suggested seats:
  mission-engine designer; multi-agent systems researcher; autonomy/alignment designer; memory and knowledge architect;
  skills/MCP ecosystem scout; surfaces and voice designer; startup operator (vibe startuping in practice); hybrid-specialty
  designer (invents new AI-native roles); simulation/evals engineer. Add seats you judge missing.
- Round 2: one red team + one "expander" (finds what everyone missed). Round 3: one chief architect writes v3.
- Then **scenario testing instead of review loops**: a separate agent walks each worked scenario through the design and lists
  where it breaks; the architect fixes; done. **No recheck chains.**
- Use Claude and Codex both where you can (Codex for at least one seat, via `codex exec` from Bash, to get a second model family).

### Practical lessons from the last session (save yourself hours)
- **Subagents cannot write "report" files** with Write (a hook refuses). Panelists should return text and you save it — or use
  `general-purpose` agents with an explicit "use the Write tool into docs/vision-v3/…" instruction, which worked for the architect
  and both engineers.
- **Builder/designer engines run in isolated worktrees off `main`**; they can only switch branch via `git switch -c vision/f7-*`
  (founder permission rule). For planning work prefer `general-purpose` agents writing into a worktree under your session root.
- **Engines have `maxTurns` 25–30.** Big-spec lanes ran out of turns every time; resume with SendMessage, or keep jobs small.
- **`git worktree add` needs the sandbox lifted** for that one command; create worktrees under `$(git rev-parse --show-toplevel)/.worktrees/`.
- **`gh` needs the sandbox lifted** (`~/.config/gh` is read-denied). `git push` needs `allowed_domains: github.com`.
- **Ledger lint** treats any backticked `c-…` id in prose as a claim id — don't write claim-style ids you haven't registered.
- **Don't read 4 MB files whole** (`F2-07-outside-review.md`, contract registries). Grep and range-read.
- Merge `origin/main` into an old branch only from a clean worktree: this session's worktree was left with untracked partial files.

### Definition of done
v3 files written and committed on a branch off `vision/v2-reenvision`; the explorer published; every worked scenario walks through
without an unexplained gap; a founder decision list of ≤10 items; session file with `qa_verdict`; push the branch. Do not merge to
`main` without the founder.
