# The Territory — the map the expansion agents are widening

**Written 2026-09-01, session 2 of the StartupOS rethink.** This is context for three parallel
expansion studies. It is NOT a plan and nothing in it is decided.

Board (visual): https://claude.ai/code/artifact/9c8caa91-e979-4d3e-99e6-209a2f27a1d3
Living spec: `docs/03-system-design/STARTUP-OS.md`
Five systems already studied: `docs/02-competitive/reference-systems/{gsd,loops,metaswarm,cast,omnigent}.md`

## What is being built

A one-founder company that runs 24/7 on Claude Code — missions that outlive a session, workers with
real hands, a loop that walks until a goal is met, and a "balcony" the founder watches and steers from.
Breadth beyond code is explicit: design, video, content, social, marketing, customer, data, testing, CI.
The founder's core complaint about the current system is that it **loses creativity to playbooks**, and
that almost everything built is a *stopping* mechanism rather than a *producing* one.

## The 14 territories

| # | Territory | What it decides |
|---|---|---|
| 01 | Missions & drive | What we chase; what keeps going at 3am; priority; abandonment; blocked vs stalled |
| 02 | Workers & roster | Who works, how many at once, packs, pods, trust, apprenticeship, retirement |
| 03 | Hands | What a worker can physically touch — MCPs, CLIs, APIs, services |
| 04 | Knowledge | Skills, mental models, learning a new field, negative knowledge, examples |
| 05 | Memory | Episodic/semantic/procedural, retrieval, conflict, forgetting, transcripts |
| 06 | Communication | Worker↔worker, the baton, collisions, pair work, broadcast, help requests |
| 07 | Context & cost | Injection, caching, compaction, cost per mission, task ids |
| 08 | Quality & truth | Oracles, lenses, second model family, council, taste vs correctness, the world's verdict |
| 09 | Control & safety | Policy seam, tool grants, gates, worldly risk, kill switch, prompt injection |
| 10 | Surfaces | Terminal, mission control, phone, voice, redirect, briefing, walkthrough, Q&A |
| 11 | Runtime | Hosts, models (Claude/Codex/Gemini), scheduling, isolation, recovery |
| 12 | Self-improvement | Learning from corrections, post-mortems, promoting patterns, A/B, measuring better |
| 13 | Economics | Cost vs worth, budgets per mission, model tiering, the company's own P&L |
| 14 | The company itself | Onboarding a venture, several at once, a second human, shutting one down |

## Current state, measured on this machine 2026-09-01

- 7 engines / 18 agent files; **2 declare any MCP server**
- Repo configures **2** MCP servers (`playwright`, `claim-append`)
- Founder's account has ~15 connected: higgsfield (video/image/audio/voice/websites), Figma, Pencil,
  Stitch, Refero, Gmail, Google Calendar, Google Drive, Notion, Miro, n8n, RunPod, mem0, Playwright
- Claude Code exposes **10 hook events**; the repo listens on **2**
- 134 curated skills + 28 mental models with stop rules — **0 of 18 agents cite one**
- 2,936 conversation transcripts on disk — **nothing reads them**
- 4 workflows exist; **1 runs**
- Mission control: 7 views, **1 acts**; the escalation Inbox has been empty on every project ever
- Strong and working: claim ledger with forced expiry, sha256 verdict binding, risk classifier,
  48-step check suite, a QA gate that blocked its own author
- `codex` NOT installed; `gemini` installed and never executed

## The twelve things never named in two sessions

1. The hands are already bought — ~15 MCP servers connected, 2 of 18 agents can reach any
2. Nothing reads the 2,936 transcripts
3. Nothing decides *what to do next* — five goals, one window
4. You cannot steer something already running
5. No verdict from the world — nothing asks *did it work*, only *is it right*
6. Blocked and stalled look identical
7. Nothing records what failed — no negative knowledge
8. Worldly risk has no tier — send / publish / pay / contact a person
9. The founder talks to this system by voice; nothing is designed for that
10. Every worker is trusted equally, forever
11. Nothing ever retires
12. It cannot explain itself — walkthroughs and Q&A were asked for and dropped

## Standing rules that constrain any proposal

- **Rule 10 — a resolver never passes what it could not check.** Fail closed on the unmeasurable.
- **Union, never average.** Weak judges are good finders and useless scorers; panels return findings, not scores.
- **Constrain the exit, never the path.** A pack is a grant and a stop, never a procedure.
- **Every rule names the mechanism that enforces it.** A rule with no mechanism is a wish.
- **Built-and-never-wired is the endemic failure mode** — in this repo and in all five systems studied.
