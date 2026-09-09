# Research lane · the room renderer — the founder's three candidates · 2026-09-05

*Recorded verbatim by the orchestrator from the sourcer lane's numbered parts (delivery truncates near 4,000 characters per message). Facts only; the decision is SPINE v62. Question: pixel-agents · Star-Office-UI · AgentOffice — repo, LICENSE read from the file, liveness, stack, input, agent-CLI integration and terminal affordance, ambiguity.*

---

## PART 1 of 5 — pixel-agents

All URLs accessed 2026-09-05.

**1. Canonical repo.** https://github.com/pixel-agents-hq/pixel-agents — GitHub API `description` is exactly "Pixel office." (H). README first heading "Pixel Agents", tagline "The most playful way to orchestrate your agents" (H).

**2. LICENSE — file read, not API-detected.** https://raw.githubusercontent.com/pixel-agents-hq/pixel-agents/main/LICENSE opens: "MIT License" / "Copyright (c) 2026 Pablo De Lucca" (H). The API's `spdx_id` agrees: MIT.

**3. Liveness** (https://api.github.com/repos/pixel-agents-hq/pixel-agents, H):

| field | value |
|---|---|
| created_at | 2026-02-08T19:14:11Z |
| pushed_at | 2026-09-05T14:41:28Z (today) |
| archived / disabled | false / false |
| stars / forks / open issues | 9,190 / 1,488 / 87 |
| language / default_branch | TypeScript / main |

Most-starred and most-recently-pushed of the three.

**4. Stack and runtime.** TypeScript with React 19; Vite for the webview, esbuild for the extension and CLI; Node 20+; Canvas 2D rendering. A Fastify server is required for both the VS Code extension and the standalone CLI, and "the CLI chooses a free local port and prints the URL" (H, verbatim). No LLM is needed to render. It visualizes Claude Code's own activity and does not call a model API itself (M-H, README-derived, source unread).

**5. INPUT — two paths, both Claude Code.** Hook events, verbatim: "a hook script receives Claude events such as `SessionStart`, `PreToolUse`, `PermissionRequest`, and `Stop`" (H). Transcript fallback, verbatim: "the runtime infers agent status by scanning Claude's JSONL session transcripts under `~/.claude/projects/`" (H). Events normalize into a shared `AgentEvent` model (M, README paraphrase, type not read from source). The hook is registered under `~/.claude/`.

**6. Agent-CLI integration and the terminal affordance.** Verbatim: "Claude Code is the reference implementation today; Codex, Gemini, Cursor, and others are on the roadmap." (H). On click-to-terminal the README is silent, but the issue tracker settles it: open issue #251, "[Bug]: Clicking agent character opens wrong terminal after /clear in another session", https://github.com/pixel-agents-hq/pixel-agents/issues/251, 2026-04-25 (H that the title reads so, H that a click-to-terminal binding therefore exists in the VS Code surface, M on its exact behavior). Open PR #347, "feat(terminal): standalone embedded terminal — launch and drive agents from the browser", 2026-07-17, is **open, not merged**, so a browser-embedded terminal is not shipped (H). Also open: PR #136 "feat: Cursor IDE support + auto-adopt existing Claude Code terminals" and PR #61 "feat: add multi-agent support (Opencode, VS Code Terminal)" (H).

**7. Ambiguity.** None. The name resolves to a single repo at 9,190 stars, with no rival close in stars or in fit.

---

## PART 2 of 5 — Star-Office-UI

All URLs accessed 2026-09-05.

**1. Canonical repo.** https://github.com/ringhyacinth/Star-Office-UI — API `description` verbatim: "A pixel office for your OpenClaw: turn invisible work states into a cozy little space with characters, daily notes, and guest agents." (H). The README tagline is Chinese, "一个像素风格的 AI 办公室看板", a pixel-art AI office dashboard (H).

**2. LICENSE — file read.** The default branch is `master`, not `main`; the `main` path returns 404. https://raw.githubusercontent.com/ringhyacinth/Star-Office-UI/master/LICENSE opens: "# Star Office UI — License & Usage Notice" / "This project is a co-created work by **Ring Hyacinth** and **Simon Lee**." / "## 1. Code / Logic License (MIT)" (H). It is a **dual license**: MIT for code and logic, "Copyright (c) 2026 Ring Hyacinth & Simon Lee"; art assets are restricted, with the README stating "禁止商用", commercial use prohibited, education, demo and exchange only (H for the code half, M-H for the asset wording, which I read via the README summary and the license API rather than clause by clause). GitHub cannot classify the file: `spdx_id` NOASSERTION, `key` other, `name` Other (H). The practical split is that the code is reusable and the sprites are not.

**3. Liveness** (https://api.github.com/repos/ringhyacinth/Star-Office-UI, H):

| field | value |
|---|---|
| created_at | 2026-02-26T03:45:35Z |
| pushed_at | 2026-03-11T03:53:42Z (≈6 months stale) |
| updated_at | 2026-09-05T13:56:40Z (metadata only, e.g. stars) |
| archived / disabled | false / false |
| stars / forks / open issues | 7,466 / 796 / 22 |
| language / default_branch | HTML / master |

Topics: agent-collaboration, ai-assistant, dashboard, flask, mobile-friendly, multi-agent, openclaw, phaser, pixel-art, status-visiualzation (spelling as published).

**4. Stack and runtime.** Flask backend on Python 3.10+, serving port 19000 by default; frontend is HTML and JavaScript with pixel sprites; Phaser per the topics; an optional Electron wrapper gives a desktop-pet mode (H). A backend is required. It is display-only by default and needs no API key to render. A Gemini API key is optional and only for AI-generated room backgrounds, "AI 生图装修"; without it the app functions normally (H).

**5. INPUT.** A `state.json` file is primary, carrying agent states enumerated as idle, writing, researching, executing, syncing, error. Samples ship as `state.sample.json` and `join-keys.sample.json`. Files under `memory/*.md` are parsed automatically for a "yesterday's notes" panel. Remote or guest agents push state over WebSocket and HTTP using join keys, via `office-agent-push.py`; state can also be set locally with `set_state.py` or the HTTP API (H on the mechanisms, M on exact field names, since I read the README rather than the sample file byte for byte).

**6. Agent-CLI integration and affordances.** Built for OpenClaw, including a skill file at `frontend/join-office-skill.md` that a visiting agent uses to join the office. No Claude Code or Codex integration is documented (M-H, absence in the README is not proof of absence in code). Clicking a character surfaces that agent's status and location. There is no terminal and no chat. It is a status dashboard (M).

**7. Ambiguity.** None for the name. One repo at 7,466 stars carries it; the only other repository surfacing on that query was iOfficeAI/AionUi, a different product entirely.

---

## PART 3 of 5 — "AgentOffice", the ambiguous name

All URLs accessed 2026-09-05.

No repository named exactly `AgentOffice` is an office-room renderer over live agent sessions. I searched the GitHub search API three ways: `AgentOffice`, `agent-office in:name`, and `agentoffice in:name,description,readme`.

**Exact-name matches, all H from the search API, READMEs unread except where noted:**

- **manpoai/AgentOfficeSuite** — 141 stars, Apache-2.0, TypeScript. "AOSE — An Office Suite Built for Agent Collaboration. Docs, tables, slides, flowcharts, canvas, and video — all editable by both humans and AI agents." A document suite, not a room. Created 2026-03-21, pushed 2026-06-03.
- **Wang7211/AgentOffice** — 1 star, Python, no license. A LangGraph, FastAPI and React agent system. Not a room.
- **rocklin945/AgentOffice** (1 star, Java), **amanshaman11/AgentOffice** (1 star, MIT), **DarkImpact1/AgentOffice** (0 stars, MIT), **agentoffice-dev/agentoffice** (1 star, created 2026-08-29), **ccivlcid/agentoffice** (0 stars, Apache-2.0). All undescribed or unrelated.
- **Tomheyer2001-ui/agentoffice** — 0 stars, Python, no license, "Autonomous multi-agent system with pixel-art UI", pushed 2026-07-26. The only exact-name match in the right category, and it is essentially unadopted.

**Likeliest intended repo, on the hyphenated reading: harishkotra/agent-office**, https://github.com/harishkotra/agent-office. It is the top-starred hyphenated match and the only one in this family with a full data set. Why likeliest: 250 stars, pixel-art office, and a description matching the founder's mental image.

1. Description verbatim: "Watch AI agents walk to desks, think, collaborate, hire interns, assign tasks to each other, execute code, search the web, and grow their team - all rendered in real-time pixel art with persistent memory across sessions." README tagline: "Self-growing AI teams in a pixel-art virtual office — powered by local LLMs." (H)
2. **LICENSE — file read.** raw…/main/LICENSE opens "MIT License" / "Copyright (c) 2026 Harish Kotra" (H). API `spdx_id` MIT.
3. Liveness: created 2026-02-25T04:43:02Z; pushed 2026-05-15T15:23:44Z, roughly four months stale; archived false; 250 stars; 81 forks; TypeScript; default branch main (H).
4. Stack: TypeScript, React, Phaser.js; a Node server with Colyseus for real-time sync; SQLite; a monorepo of core, adapters, server, ui and cli packages. A backend is required. **An LLM is required to render**, Ollama locally by default or any OpenAI-compatible endpoint such as OpenAI, Gaia or OpenRouter (H). That is the decisive difference from the other two projects.
5. INPUT: none external. The room is a **simulation the model drives**. The flow is Ollama, then OllamaAdapter, then `Agent.think()`, then Colyseus state, then the Phaser UI, with agents deciding an action roughly every 15 seconds and the "LLM returns: { thought, action, target, toolCall }". Memory persists in SQLite with semantic embeddings. It reads no Claude Code JSONL and no agent-runtime log (H).
6. Agent-CLI integration: none documented for Claude Code, Codex or any CLI (M-H). Click affordance: "Click any agent sprite to have the camera smoothly track them", a focus mode; React overlays provide Chat, TaskBoard, Inspector and SystemLog panels. A chat exists, a terminal does not (M-H).
7. Lineage caveat: its own README's clone command points at `AjStraworern/agent-office`, not `harishkotra/agent-office`. A rename or fork relationship I did not resolve (M).

---

## PART 4 of 5 — closer candidates for "AgentOffice", plus adjacent repos

All from the GitHub search API, accessed 2026-09-05. Metadata confidence H. **READMEs were not read for any repo in this part**, so stack, input and affordances are UNKNOWN rather than absent.

**Closer to the founder's stated use, a room over live agent sessions:**

- **percheniy/office-for-claude-agents** — https://github.com/percheniy/office-for-claude-agents — "Real-time agent visualization in pixel office for Claude CLI" — 24 stars, TypeScript, license NOASSERTION (api-detected, file not read), created 2026-03-30, pushed 2026-08-05. The only repo in the whole survey whose description names the Claude CLI and real-time visualization together.
- **fakeou/agent-office** — "Let Claude Code and Codex work in a pixel office and enjoy a full…", description truncated in the API response I read — 15 stars, JavaScript, no license detected, created 2026-03-08, pushed 2026-03-22.
- **kylian-08/AgentsOffice** — "Local-first multi-agent office for Cursor / Codex / Claude Code…" — 2 stars, TypeScript, MIT, created 2026-07-18, pushed 2026-08-18.
- **Pixel-Process-UG/agent-office** — "Pixel-art virtual office for AI agent teams" — 39 stars, TypeScript, MIT, created 2026-03-17, pushed 2026-03-19.
- **pjmbatman/agent-office** — "2D Pokemon-style multi-agent orchestration desktop app" — 2 stars, TypeScript, MIT, pushed 2026-03-27.
- **yantodev/agent-office** — "Local-first desktop multi-agent harness inspired by the category…" — 2 stars, TypeScript, MIT, created 2026-09-01, pushed 2026-09-03, four days old.
- **baturyilmaz/agent-office** — "Slack for AI Agents" — 23 stars, TypeScript, no license detected, pushed 2026-03-06.

**Adjacent repos surfaced by the `pixel-agents` search, not asked about, listed because they occupy the same surface:**

- **rullerzhou-afk/clawd-on-desk** — "A pixel desktop pet that watches Claude Code, Codex, Cursor & other AI coding agents" — 6,148 stars, JavaScript, **AGPL-3.0**, created 2026-03-18, pushed 2026-09-05 today. Note the copyleft: it is the only strong-copyleft project in this survey.
- **IvanWng97/pixtuoid** — "Terminal pixel-art office for AI coding agents" — 469 stars, Rust, MIT, created 2026-05-21, pushed 2026-09-05 today.
- **ianscott313/miniverse** — "A tiny pixel world for your agents." — 295 stars, TypeScript, MIT, created 2026-03-07, pushed 2026-03-13.
- **agentsmill/age-of-agents** — "Age of Agents — watch your AI coding sessions grow a peaceful pixel-art realm" — 259 stars, TypeScript, NOASSERTION, created 2026-06-14, pushed 2026-07-22.
- **shahtab123/awesome-living-interfaces** — "A curated collection of game-inspired software, living interfaces…" — 12 stars, created 2026-07-08, pushed 2026-07-16. A curated list, and likely a faster index of this category than repeated search-API queries.

**One pattern worth recording, since it bears on the ambiguity.** Of everything found, exactly three projects are pushed today: pixel-agents, clawd-on-desk and pixtuoid. Star-Office-UI and harishkotra/agent-office have both been static for months. Liveness and star count diverge sharply here, so a ranking by stars alone would put a six-month-stale project second.

---

## PART 5 of 5 — repo-context check, and Gaps

**Repo-context check** (read locally 2026-09-05, H). None of the three names appears in the prior room survey at `docs/03-system-design/final-v2/research/surfaces.md`. A case-insensitive grep for pixel-agents, Star-Office, AgentOffice, "AI Town" and "Generative Agents" returned zero matches. A broader grep for pixel, office, spatial, room, avatar, Town and Generative returned exactly one line, line 115: "**§4A.11's finding — \"no Claude Code fleet surface is spatial\"** — nothing I fetched overturns it. `claude-view` renders sub-agent **trees**, which is a graph, not a space."

All three are therefore new to that survey. That standing finding is contradicted by at least three repos in this report: pixel-agents at 9,190 stars reads Claude Code hooks and JSONL into a pixel office, and clawd-on-desk and pixtuoid both watch Claude Code. I did not open SPINE.md, so I make no statement about the current ranking text beyond noting it went unverified.

**Gaps.**

1. **No claim was registered in the ledger.** The claim-append tool is not present in this session's tool set, which is Read, Glob, Grep, WebSearch, WebFetch and SendMessage. Every durable fact above is unregistered prose. This is a departure from my normal contract, stated rather than hidden.
2. **pixel-agents:** the `AgentEvent` type was not read from source, so the schema is README-level only. Whether click-to-terminal works outside VS Code is unresolved; open PR #347 for a browser terminal suggests it does not.
3. **Star-Office-UI:** I did not read `state.sample.json`, so I have no verbatim schema and the field names I gave come from the README. The art-asset restriction wording comes from the README and the license API rather than a clause-by-clause read of the license file.
4. **harishkotra/agent-office:** the README's clone command names a different owner, `AjStraworern`. The rename or fork lineage is unresolved, so I cannot say which repo is upstream.
5. **Every repo in Part 4 has an unread README.** Their stack, input and affordances are UNKNOWN, not "none". That includes percheniy/office-for-claude-agents, which on description alone is the closest match to the founder's use and has the least evidence behind it.
6. **Nothing was installed or executed.** Every "requires a backend" claim is documentation, not measurement.
7. **Open issues were not read** — 87 on pixel-agents, 22 on Star-Office-UI. Whether any is a blocking defect is unknown.
8. **The write direction is unverified for all three.** Whether any accepts a message from the room back into a running agent session is unestablished. The only evidence either way is the title of pixel-agents PR #347, "launch and drive agents from the browser", and that PR is open.
9. **The name "AgentOffice" was never disambiguated by the founder.** I ranked candidates by fit and adoption. If the founder saw it somewhere specific, that source would settle it faster than any search I can run.

**Report complete: parts 1 through 5 delivered.** Three projects researched, licenses read from file for all three rather than taken from GitHub's detection, and one name found genuinely ambiguous with eleven candidate repositories listed.
