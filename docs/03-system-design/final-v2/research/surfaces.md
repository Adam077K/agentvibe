# Lane · surfaces · 2026-09-05

## Questions answered

Five: (b) agent flows, (d) board→session, (f) 3D file graph, (g) agent canvas, and the terminal-pop mechanism. Every finding below carries a URL and an access date of **2026-09-05**. Licence SPDX values marked `[api]` come from GitHub's own licence detection over the repository's LICENSE file, not from a line I quoted — the ceiling was reached before I could fetch each raw LICENSE, and that is named in Gaps.

**The single largest finding is that (b) substantially ships.** Claude Code's **agent teams** are a lead plus named teammates, each a full independent session, rendered as a panel of working/idle rows, messageable by name, optionally one terminal pane each. Confidence **H**.

> *"One session acts as the team lead, coordinating work, assigning tasks, and synthesizing results. Teammates work independently, each in its own context window, and communicate directly with each other. You can also talk to any teammate directly without going through the lead."*
> — <https://code.claude.com/docs/en/agent-teams>, accessed 2026-09-05

**The join key a website needs already exists on disk.** Team config is `~/.claude/teams/{team-name}/config.json`, the mailbox is `~/.claude/teams/{team-name}/inboxes/{agent-name}.json`, the task list is `~/.claude/tasks/{team-name}/`, and the team name is `session-` plus the first eight characters of the session id. Confidence **H**.

> *"The team config holds runtime state such as session IDs and tmux pane IDs, so don't edit it by hand or pre-author it: your changes are overwritten on the next state update."* — same page

That sentence carries both halves: a **tmux pane id per teammate** is readable from a JSON file (so "click an agent, pop its terminal" has a target), and the file is **overwritten**, so it is a read source and not a write target.

## Findings by page

### (b) agent flows — orchestrator and children, who works, who sleeps

- **Claude Code agent teams**, `DOCUMENTED` · **H**. Panel rows: *"an idle teammate's row stays in the panel while any teammate or subagent is still working"*; idle rows hide after 30 s once the whole panel is idle; more than three idle collapse into `N idle agents`. Working, failed, and viewed teammates always keep their own rows. That is exactly the founder's "who is working and who just sleep", already ordered.
- **Constraints on it**, all `DOCUMENTED` · **H**: experimental and **off by default** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`); *"No nested teams: teammates cannot spawn their own teammates"*; *"One team per session"*; `/resume` does not restore in-process teammates; spawning requires an interactive session, so `-p` and the Agent SDK never form teams. A hierarchy deeper than lead→teammate is **not** available through this mechanism.
- **`claude-view`** (tombelieber) — a Rust dashboard rendering *sub-agent trees* with per-agent cost, shipping as a plugin that auto-loads. Source is a third-party blog and the GitHub result title, not the repo — `REPORTED` · **L-M**. FINAL-PLAN §13.10 already records it as MIT and read-only; I did not re-verify licence or last commit. <https://github.com/tombelieber/claude-view>
- **`agent-paperclip`** (fredruss), *"Desktop 'Paperclip' Companion for Claude Code & Codex"* — exists; licence, commit date and mechanism **unverified**. `REPORTED` · **L**. <https://github.com/fredruss/agent-paperclip>
- **`subagent-viewer`** (nyanko3141592), a TUI monitoring subagent activity in real time. Unverified beyond existence · **L**.
- **Crystal** — MIT `[api]`, *"Run multiple Codex and Claude Code AI sessions in parallel git worktrees"*, 3,115 stars, **last push 2026-02-26**, six months cold. Not archived. **H** on the date.
- **OpenHands** — MIT `[api]`, **last push 2026-09-04**, 86,228 stars. Alive. It is a web IDE that owns its own runtime, not a viewer of your sessions. **H** on licence/date, **M** on the characterisation.
- **Conductor** (Melty Labs, YC S24) — a **closed-source Mac app** running Claude Code, Codex, Cursor and OpenCode in parallel, one git worktree per workspace, each with its own terminal and diff. `REPORTED` from search results only, no page fetched · **M**. <https://docs.conductor.build/>

### (d) board → session

- **OpenAI Symphony is the closest live prior art and it did not exist in the prior survey.** Apache-2.0 `[api]`, **Elixir**, created 2026-02-26, **last push 2026-08-19**, 27,042 stars, not archived. Description, quoted from the API: *"Symphony turns project work into isolated, autonomous implementation runs, allowing teams to manage work instead of supervising coding agents."* **H** on all of that. The mechanism — polls Linear on an interval, one isolated workspace per issue, restarts stalled agents — is `REPORTED` from secondary coverage · **M**, because I did not fetch the spec itself. <https://api.github.com/repos/openai/symphony>
- **vibe-kanban is worse than the prior survey recorded.** Apache-2.0 `[api]`, 28,017 stars, **last push 2026-04-24** (unchanged from §4A.10's reading), and the README's own first status line now reads **"Vibe Kanban is sunsetting"** — `DOCUMENTED` · **H**. It supports *"Claude Code, Codex, Gemini CLI, GitHub Copilot, Amp, Cursor, OpenCode, Droid, CCR, and Qwen Code"*, and its execution unit is quoted as: *"each workspace gives an agent a branch, a terminal, and a dev server."* That sentence is the founder's (d) in nine words, shipped, in a project announcing its own end.
- **Nothing found gives a card a *team*.** vibe-kanban and Symphony both map one task to **one** agent workspace. Dragging a card to launch *a team of agents* has no prior art in what I fetched. Gap, named below.

### (f) 3D file graph

- **`vasturiano/3d-force-graph`** — MIT `[api]`, 6,369 stars, **last push 2026-04-05**, not archived. It is *"3D force-directed graph component using ThreeJS/WebGL"*. **H**. Its input is a `{nodes, links}` object; **it does not read a repository**. The file-tree-to-graph extraction is not in it.
- **Gource** — GPL-3.0 `[api]`, 13,128 stars, **last push 2026-03-06**. *"software version control visualization"*. **H**. It animates a 2.5D tree from a VCS log; it is a replay of history, not a live wired brain, and GPL-3.0 is the strictest licence in this report.
- **No maintained repo→3D-graph project was verified.** The search returned the topic page, unrelated forks, and one unnamed "3D IDE for Obsidian" that renders a vault as a code city and dispatches coding agents. I could not resolve it to a repository. `REPORTED` · **L**. This is the thinnest of the five sub-questions.

### (g) agent canvas

- **Langflow** — MIT `[api]`, 154,275 stars, **last push 2026-09-05** (today). Alive. **H**.
- **Flowise is ARCHIVED.** `archived: true`, licence `NOASSERTION` / *"Other"*, last push 2026-08-13, 55,425 stars. **H** on both fields from the API. An archived repository with an undetected licence is two independent reasons for caution.
- **n8n's licence is the binding constraint, and I read the file.** `NOASSERTION` `[api]`, last push 2026-09-05, 203,420 stars — alive, but:

> *"You may use or modify the software only for your own internal business purposes or for non-commercial or personal use. You may distribute the software or provide it to others only if you do so free of charge for non-commercial purposes."*
> — <https://raw.githubusercontent.com/n8n-io/n8n/master/LICENSE.md>, accessed 2026-09-05 · **H**

The same file also states *"Content of branches other than the main branch (i.e. "master") are not licensed."*

### Terminal pop on macOS

- **Claude Code ships split panes per teammate**, `DOCUMENTED` · **H**: *"Split panes: each teammate gets its own pane. You can see everyone's output at once and click into a pane to interact directly. Requires tmux, or iTerm2."* Default is `in-process`; `auto` upgrades when already inside tmux or in iTerm2 with `it2`; `tmux` forces split panes and auto-detects; `iterm2` (v2.1.186+) forces iTerm2 native panes and **requires the `it2` CLI** plus **iTerm2 → Settings → General → Magic → Enable Python API**.
- **`--teammate-mode` is experimental and hidden**: *"The `--teammate-mode` flag is experimental and doesn't appear in `claude --help`."* · **H**
- **Split panes are unsupported in VS Code's integrated terminal, Windows Terminal, and Ghostty.** · **H**
- **`claude --attach <id>`** — *"Attach to a background session in this terminal"* · **H**. **`--bg`/`--background`** — *"Start the session as a background agent and return immediately. Prints the session ID and management commands."* **`--session-id`** takes a caller-supplied UUID. **`--name`** sets a name *"shown in `/resume` and the terminal title."*
- **A discrepancy with this session's own handoff.** That handoff states Claude Code ships `-w <worktree>` and `--tmux`. The CLI reference I fetched documents neither: the fetch returned *"The `-w` / `--worktree` flag is not documented in the provided CLI reference table"*, and the terminal flag is `--teammate-mode`, not `--tmux`. Absence from one documentation page is not absence from the binary — treat as **unresolved**, confidence **M**, resolvable in one `claude --help`.
- **claude-squad's mechanism, read from source** · **H** — <https://raw.githubusercontent.com/smtg-ai/claude-squad/main/session/tmux/tmux.go>:

```
exec.Command("tmux", "new-session", "-d", "-s", t.sanitizedName, "-c", workDir, t.program)
exec.Command("tmux", "attach-session", "-t", t.sanitizedName)
exec.Command("tmux", "capture-pane", "-p", "-e", "-J", "-t", t.sanitizedName)
exec.Command("tmux", "kill-session", "-t", t.sanitizedName)
exec.Command("tmux", "has-session", fmt.Sprintf("-t=%s", t.sanitizedName))
```

Session names are prefixed `claudesquad_`. Messaging is `SendKeys` plus `TapEnter()` writing `0x0D`. This is the whole of "pop a terminal, watch it, type into it, kill it" in five commands with no macOS-specific API.

## Licences

| Project | LICENSE URL | Licence | Quoted line | Last commit (`pushed_at`) |
|---|---|---|---|---|
| vibe-kanban | <https://api.github.com/repos/BloopAI/vibe-kanban> | Apache-2.0 `[api]` | not quoted here; §4A.10 read `LICENSE` from file | **2026-04-24** |
| openai/symphony | <https://api.github.com/repos/openai/symphony> | Apache-2.0 `[api]` | not quoted | **2026-08-19** |
| stravu/crystal | <https://api.github.com/repos/stravu/crystal> | MIT `[api]` | not quoted | **2026-02-26** |
| OpenHands | <https://api.github.com/repos/All-Hands-AI/OpenHands> | MIT `[api]` | not quoted | **2026-09-04** |
| 3d-force-graph | <https://api.github.com/repos/vasturiano/3d-force-graph> | MIT `[api]` | not quoted | **2026-04-05** |
| Gource | <https://api.github.com/repos/acaudwell/Gource> | GPL-3.0 `[api]` | not quoted | **2026-03-06** |
| Langflow | <https://api.github.com/repos/langflow-ai/langflow> | MIT `[api]` | not quoted | **2026-09-05** |
| Flowise | <https://api.github.com/repos/FlowiseAI/Flowise> | **NOASSERTION / "Other"** `[api]` · **ARCHIVED** | not quoted | 2026-08-13 |
| n8n | <https://raw.githubusercontent.com/n8n-io/n8n/master/LICENSE.md> | Sustainable Use (NOASSERTION `[api]`) | *"You may use or modify the software only for your own internal business purposes or for non-commercial or personal use."* | **2026-09-05** |
| claude-squad | §4A.10, read from `LICENSE.md` | AGPL-3.0 | prior survey | 2026-08-20 (prior survey) |

## Launch mechanisms found

| Mechanism | Who ships it | Exact command or API | What it needs |
|---|---|---|---|
| tmux split pane per teammate | Claude Code | `claude --teammate-mode tmux` (or `auto`) | tmux on PATH; pane ids land in `~/.claude/teams/{team}/config.json` |
| iTerm2 native split pane | Claude Code | `claude --teammate-mode iterm2` | `it2` CLI (<https://github.com/mkusaka/it2>) **and** iTerm2 Python API enabled |
| Background session + attach | Claude Code | `claude --bg …` then `claude --attach <id>` | a terminal to attach in; `--bg` prints the id |
| Caller-assigned session id | Claude Code | `claude --session-id <uuid>` | a valid UUID minted by the caller |
| Message a running agent | Claude Code agent teams | write/read `~/.claude/teams/{t}/inboxes/{agent}.json` | entries are validated on read; malformed ones are *"removed from the file"* |
| Detached tmux session per agent | claude-squad (AGPL-3.0) | `tmux new-session -d -s <name> -c <dir> <program>`; `tmux attach-session -t <name>` | tmux; the tool owns the session |
| Read a pane without attaching | claude-squad | `tmux capture-pane -p -e -J -t <name>` | tmux |
| Type into a live pane | claude-squad | `SendKeys` + `0x0D` | tmux |
| Worktree per board card | vibe-kanban (Apache-2.0, sunsetting) | its own Rust executor; *"a branch, a terminal, and a dev server"* | a 30-crate Rust runtime that owns execution |
| Issue → isolated run | OpenAI Symphony (Apache-2.0) | polls Linear, one workspace per issue | Elixir runtime; Linear as control plane · **M** |

**Not found:** any primary source for AppleScript, `open -a Terminal`, or an iTerm2 AppleScript hand-off. I fetched none, so the obvious macOS route is **unverified**, not absent.

## What this changes against FINAL-PLAN §13

Facts only, by row.

1. **§13.10, row "See the fleet"** — the row lists `claude agents` and `claude-view`. Two shipped verbs are missing from it: `claude --attach <id>` and `claude --bg`, both documented in the CLI reference.
2. **§13.10, row "Redirect without killing"** — the row says a redirect *"dies with the session."* Agent teams add a second, on-disk transport: a per-agent mailbox JSON file with a validating reader. Its durability is not stated on the page.
3. **§13.10, row "A page that answers back"** — unaffected by anything I fetched.
4. **§13.8's refusal of vibe-kanban** — the ground under it moved in the same direction: the README's own status line reads *"Vibe Kanban is sunsetting"*, which is stronger than "unmaintained since 2026-04-24".
5. **§13.8's ranking is silent on OpenAI Symphony**, which is Apache-2.0, alive on 2026-08-19, and is the only board-to-session prior art found with a live commit.
6. **§13.2's Balcony table has no dashboard row**, and *"nothing is only informational."* The founder's page (c) is a cost, tokens and efficiency dashboard. The two are stated positions, not a resolved question.
7. **§4A.11's finding — "no Claude Code fleet surface is spatial"** — nothing I fetched overturns it. `claude-view` renders sub-agent **trees**, which is a graph, not a space.
8. **The handoff's line at 195–198** claims `-w` and `--tmux`. The CLI reference documents `--teammate-mode` and does not document `-w`. Unresolved.

## Gaps

1. **Licence lines are not quoted for nine of ten projects.** Only n8n's LICENSE was fetched raw; the rest are GitHub's SPDX detection. This fails the brief's own standard and is the largest defect in this report. Each is one `raw.githubusercontent.com/<repo>/<branch>/LICENSE` fetch away.
2. **`Flowise`'s NOASSERTION is unexplained.** Archived plus undetected licence needs the file read before anyone relies on it.
3. **(f) is barely covered.** No maintained project was verified that reads a repository's files into a 3D graph. `3d-force-graph` is a renderer with no repo reader; Gource replays a VCS log. The "3D IDE for Obsidian as a code city dispatching coding agents" could not be resolved to a repository.
4. **No prior art for a card that launches a *team*.** Every board-to-session project found maps one task to one agent.
5. **AppleScript / `open -a Terminal` unverified** — no primary source fetched.
6. **claude-view and agent-paperclip carry no verified licence, commit date or mechanism.** Both are named in the brief; both are `REPORTED` only.
7. **Conductor was not fetched.** Its row is search-result summary, so its worktree and terminal claims are `REPORTED` · M.
8. **Symphony's spec was not read.** Licence and liveness are `H` from the API; every mechanism claim about it is `M` from secondary coverage.
9. **Cursor background agents and the Claude Code GitHub/Linear integrations were not reached.** Named in the brief, not researched — unsearched, not empty.
10. **Agent Zero was not fetched.** Named in the brief, absent here.
11. **Nothing was run, installed or published, and I appended nothing to the claim ledger.** Several findings above are durable enough to qualify as claims with a `valid_until`; I left them as findings because the dispatching brief bounded this lane to a returned report. That is a deliberate omission, not coverage.

## Sources fetched (17) · failed fetches (0)

Six repository files by absolute path; eleven network fetches — nine GitHub API endpoints and raw files, two documentation pages — plus four web searches. No fetch failed. Tool-call ceiling of 25 reached exactly, which is why gaps 1, 3, 6, 9 and 10 remain open.
