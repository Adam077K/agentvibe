# Research lane · what the strongest systems shipped since 2026-06 that v2 does not account for · 2026-09-06

*Recorded verbatim by the orchestrator from the sourcer lane's numbered parts (delivery truncates near 4,000 characters per message). Facts only; the rethink round's synthesis decides. Question: Claude Code changelog after 2.1.200 · Codex changelog since 0.124.0 · Gemini CLI since 0.30 · Devin · Factory · any measured unattended multi-agent company since 2026-06.*

---

## PART 1 of 6 — Claude Code changelog: models and cost

Parts: 1 models/cost · 2 grants, teams, cross-session messaging · 3 scheduling, goal, hooks · 4 Codex · 5 Gemini CLI, Devin, Factory · 6 the measured-company question + Gaps.

Source for parts 1–3: https://code.claude.com/docs/en/changelog, accessed 2026-09-06. Entries run 2.1.238 (Aug 20) to 2.1.263 (Sep 6). research/ quotes vendor doc pages and never the changelog, so every item below is new to it.

1. **Fable 5.1 has shipped with a published price.** 2.1.258, Sep 1 2026: *"Added Claude Fable 5.1 (`claude-fable-5-1`), now the default Fable model — 1M context, $10/$50 per Mtok with $0.25/Mtok cache reads"*. H. → **v57 partially**: the id and the 0.025x cache read are confirmed; no subscription-seat statement, so v57's UNVERIFIED stands.

2. **An alias trap against v57.** Same version: *"Changed `fable` and `best` in Claude apps gateway sessions to keep resolving to Fable 5 for now, since gateways not yet configured for Fable 5.1 reject it; pick Fable 5.1 in `/model` to use it"*. H. → **v57/§G lacks**: an agent file naming `fable` and one naming `claude-fable-5-1` are not the same routing.

3. **Sonnet 5 is $2/$10 as standard list price.** 2.1.243: *"Updated the `/model` picker and the bundled `claude-api` skill to show Sonnet 5's $2/$10 per Mtok pricing as its standard list price rather than a limited-time promo"*. H. → check §G's Sonnet row; if it carries a promo caveat it is stale.

4. **Cost became machine-readable in four places page 3 could read instead of compute.** 2.1.251: *"Added a per-session prompt-cache line to `/cost` (hit ratio, misses, tokens re-cached, warm/cold) and a matching `prompt_cache` object for status line scripts"*; *"Added a Spend limit bar to `/usage` and a `rate_limits.spend_limit` status line field"*. 2.1.243: *"Added a Loops breakdown to `/usage`: per-loop run count, total tokens, tokens per run, and last run"*; *"Added `modelPricing` managed setting so an organization's contracted per-model rates and discount multiplier are used for `/cost`, the status line, and telemetry cost figures instead of list price"*. H. → **§D page 3 / v14 lacks**: the page is specified over the event log joined to a hand-kept price table, while the vendor now emits cache hit ratio, spend limit and per-loop token counts as structured status-line fields.

5. **`--max-budget-usd` arithmetic changed.** 2.1.239: *"Cost estimates (`/cost`, status line, `--max-budget-usd`) now include the 1.1× US-only-inference premium for data-residency workspaces"*. H. → **v23 partially**: still a local estimate, now with a residency multiplier.

6. **Cache TTL is now a per-agent frontmatter field.** 2.1.248: *"Added `experimental.cacheTtl` (`"5m"` or `"1h"`) to agent frontmatter: a per-agent prompt cache TTL used when no subagent TTL setting is configured"*. 2.1.243: *"Added `promptCacheTtl` and `subagentPromptCacheTtl` settings so API-key and cloud-provider users can keep a 1-hour prompt cache on the main conversation while subagents stay at 5 minutes"*. H. → **§B.2 lacks a column, §G.3 lacks a row**: v57 justifies Fable on cache reads at 0.025x, and TTL is what decides whether that cache is warm.

---

## PART 2 of 6 — Claude Code changelog: grants, teams, cross-session messaging

Same source and access date as part 1: https://code.claude.com/docs/en/changelog, accessed 2026-09-06.

7. **`--restricted` carries two clauses runtimes.md does not record, and both bear on v10 and v11.** 2.1.248: *"Added `--restricted` (or `CLAUDE_CODE_RESTRICTED=1`): removes the built-in tools that run commands or code and `WebFetch` (unless named in `--tools`), keeps file tools inside the working directory, refuses `bypassPermissions`, and ignores user, project and local settings files"*. H. runtimes.md quotes only the first clause. → **v10 gains a second mechanism**: the flag refuses `bypassPermissions` by itself, so the managed-settings `disableBypassPermissionsMode` is no longer the only thing standing there. → **v11 partially**: on the `-p` carrier, user/project/local settings are ignored outright, which narrows what the managed file has to carry and widens what argv alone decides.

8. **A read boundary that is a settings field, not argv.** 2.1.258: *"Added a one-time prompt in auto mode before the first file read outside the working directories, with the option to block such reads (`permissions.blockReadsOutsideWorkingDirectories`)"*. H. → **v43 lacks**: v43 says the tester's blindness (v8) and the builder's exclusion from architect paths (v7) are argv facts on the `-p` path and `permissions.deny Edit(<path>)` on the other two, marked UNVERIFIED. This is a *read* narrowing expressible in settings, which is the carrier v43 could not name for the subagent and team mechanisms.

9. **`--add-dir` now refuses network paths.** 2.1.258: *"Changed `--add-dir`, `/add-dir`, and `additionalDirectories` to refuse network paths (UNC shares, `/net/<host>` automounts) with a message before touching them; on Windows use a mapped drive letter"*. H. → **v34 minor**: a grant composed by `bin/run` cannot point at a share.

10. **Per-agent model now outranks the environment.** 2.1.251: *"Changed `CLAUDE_CODE_SUBAGENT_MODEL` to set the default subagent model rather than override everything: an agent definition's `model:` and an explicit per-spawn model now take precedence over it"*. H. → **§B.2 and v59 have the field; this is what makes it bind.** Before it, one env var silently flattened fourteen per-agent model choices.

11. **Cross-session messaging is a shipped fleet transport, and v2 has no row for it.** 2.1.248: *"Added cross-session messaging (`SendMessage` / `ListAgents`) between sessions on the same machine on Bedrock, Vertex, and Foundry, and when telemetry is disabled"*. 2.1.239: *"`ListAgents` and `/list-agents` now list your live teammates (previously only subagents and other sessions appeared, so a reachable teammate looked absent)"*. 2.1.243: *"Changed the cross-session messaging inbox socket to close connections that send no complete line within 30 seconds; scripts posting to it should connect once their data is ready"*. H. → **v13 and §C.4 lack a fourth row.** v13 names three *dispatch* mechanisms and no channel between sessions that are already running. §D page 2's "message → write the agent's inbox file" is specified against the teams mailbox JSON; there is now a line-oriented socket with a documented 30-second rule, which is what a page-2 control would post to.

12. **Agent teams were repaired four times and never promoted.** 2.1.251: *"Fixed agent teams: a teammate's final answer not reaching the team lead — it now arrives in the idle notification instead of a content-free 'available' notice"*. 2.1.260: *"Fixed agent teams: an in-process teammate's transcript losing messages, or going blank, during long API retry waits"*. Also 2.1.261 (announcement resend causing a prompt-cache miss) and 2.1.257 (tmux/iTerm2 panes staying open after shutdown). H. → **v59 has teams on**; nothing in this window says they left experimental, and the failure class is lost teammate output, which is what §D page 2 renders.

---

## PART 3 of 6 — Claude Code changelog: scheduling, goal, hooks

Same source and access date as parts 1–2: https://code.claude.com/docs/en/changelog, accessed 2026-09-06.

13. **`/schedule` exists as a slash command and no research file has a row for it.** Two versions carry the same fix line, 2.1.257 and 2.1.259: *"Fixed `/schedule` routines whose prompt was saved without a message role and then ran with nothing to do"*. 2.1.258: *"Fixed remote and scheduled sessions failing with 'user messages must have non-empty content' after a re-sent permission approval could not be applied"*. H that the command exists and drives routines. **Its semantics are UNKNOWN**: https://code.claude.com/docs/en/schedule returned HTTP 404 on 2026-09-06, so interval floor, storage location and headless status are unread. → **v12 and v55 partially**: runtimes.md's three scheduling tiers are Routines, desktop scheduled tasks and `/loop`. A `/schedule` command inside the CLI that writes routines is a fourth surface, and v55 dispatches standing intents from our own Watch without considering it.

14. **`/goal`'s check-in behaviour changed twice and supersedes what runtimes.md records.** runtimes.md has *"Check-ins start at 30 minutes and double to a 4× ceiling"*. 2.1.239 and 2.1.259: *"Fixed `/goal`: repeat check-ins on long-running background work now back off (30 min, then 1 h, then every 2 h) instead of repeating every 30 minutes"* and *"Fixed `/goal`: resuming a session from the `claude --resume` picker now restores its active goal"*. 2.1.246: *"`/goal`: Changed idle sessions to start at most three check-ins on long-running background work per goal; your next message allows three more"*. H. → **v12 has `/goal`; the ladder and the three-check-in cap are new.** The cap matters for a night run: a goal loop on background work gets three check-ins and then nothing until someone messages it, and nobody is there to message it.

15. **`/loop` got wider, which strengthens v12's losing image rather than the decision.** 2.1.248: *"Changed `/loop`: self-paced dynamic mode and the no-prompt autonomous default are now always available, including on Bedrock/Vertex/Foundry"*. H. → **v12 unchanged**: `/loop` is still session-scoped and still refused in production.

16. **The `Workflow` tool's prompt cost fell 5.7x.** 2.1.248: *"Improved the Workflow tool's prompt footprint: its description is now about 1k tokens instead of 5.7k, with the script-writing reference moved into a bundled `workflow-authoring` skill"*. H. → **v35 unchanged and cheaper**: containment costs less to hold than it did, and there is now a bundled skill named `workflow-authoring` that §E's namespaces do not list.

17. **Two new hook events, and one of them is the natural gate for §G's routing.** 2.1.251: *"Added `PreModelSwitch` and `PostModelSwitch` hook events (block, confirm, or annotate a model switch); `SessionStart` resume hooks now receive session staleness and the estimated re-cache cost"*. H. → runtimes.md's *"34 events, 10 blocking"* is at least 36 now, and its own confidence on that count was medium. → **§12 lacks a model-switch gate.** v57 puts Fable on builder and architect and v21's escalation rule is the losing image; `PreModelSwitch` is a blocking event that could enforce either, and no row uses it.

18. **Inline output caps are now settings.** 2.1.261: *"Added `bashOutputMaxChars` and `taskOutputMaxChars` settings to raise how much command and background-task output Claude receives inline before it is saved to a file, up to 128K characters"*. H. → **§16's context budget lacks a row**: the handoff limit is stated as ≤ 500 tokens by convention, and this is a vendor-enforced ceiling on the largest single source of unplanned context.

---

## PART 4 of 6 — OpenAI Codex since 0.124.0

Sources: https://learn.chatgpt.com/docs/changelog and https://github.com/openai/codex/releases, both accessed 2026-09-06. **Confidence ceiling for this part is M, not H**: both pages were summarised by the fetch rather than returned whole, and the June–July window is unread (part 6, gap 4).

19. **The version floor in v32 is 29 minor versions stale.** Latest release visible is **0.153.4, 2026-09-04**; the window also shows 0.153.3 and 0.153.2 (Sep 3–4), 0.153.0 (Sep 3), 0.152.0 (Sep 1), 0.151.0 (Aug 29), 0.150.1 (Aug 27), 0.150.0 (Aug 26). H on the version numbers and dates. → **v32 partially**: its rehearsal is specified as *"version ≥ 0.124.0"*, which is now satisfied by anything installed and no longer discriminates.

20. **Codex has an inter-task messaging primitive, and §H has no row for it.** 0.150.0, 2026-08-26: *"Reference other Codex tasks with `@` mentions"*, and agents can *"read, create, or message tasks from terminal"*. M. → **§H and v13 lack**: this is Codex's analogue of the cross-session channel in part 2, item 11. Two providers shipped agent-to-agent messaging in the same window and the plan models neither.

21. **A third Codex control axis appeared: Guardian.** 0.153.0, 2026-09-03: *"Full Access skips Guardian reviews for confirmation-only actions. User approval mode skips background Guardian scoring and prewarming, while sensitive-action checks and requests for user input retain their existing handling."* And: *"Guardian review history survives compaction, restarts, and user-created forks while respecting rollback boundaries and isolating subagent history."* M–H, quoted from the releases page. → **§C.1 lacks this entirely.** The band table models Codex as `approval_policy` × `sandbox_mode`, two axes. Guardian is a background scoring layer whose behaviour changes with the approval mode, so the two-axis cell understates what governs a Codex run. Note also *"isolating subagent history"* — Codex subagents have their own review history, which §H does not describe.

22. **Codex hooks gained an `Interrupt` event.** 0.150.0: *"New `Interrupt` hooks run commands or MCP handlers when an active top-level turn is interrupted"*. M. → **§H partially**: research/runtimes.md has Codex hooks only as *"behind `codex_hooks = true`"*, unenumerated. An interrupt event is the cord's natural Codex-side receiver, and no row names it.

23. **Extensions can interpose on MCP tool results.** 0.151.0, 2026-08-29: extensions can *"inspect or replace MCP tool results before reaching the model"*. M. → **§F and v53's tool door lack**: an admitted tool's *output* can now be rewritten by an extension before the model sees it, which is a taint-path the door does not test for.

24. **On the two questions v2 most needs answered, the finding is absence.** Nothing in any Codex entry I could read from 2026-08-26 to 2026-09-04 mentions `codex cloud exec`, a cloud REST API, cloud task creation, cancel or poll, goal mode, or issue #19945. H on the absence *within the entries read*; the June–July window is unread, so this is not a clean negative. → **v32 stands** (the TTY defect is not recorded as fixed) and **v56(b) stands** (Codex cloud as a maker is still UNVERIFIED, still resting on issue #24777 alone). **Do not read this as a vendor denial** — it is four weeks of release notes with no mention, against a question that would be answered on a docs page rather than in a changelog.

One correction to carry: 0.152.0, 2026-09-01, adds *"Rate-limit banners with actions for checking usage, managing credits, resetting limits"* and *"Terminal UI and `codex exec` show credential-refresh progress, including Amazon Bedrock reauthentication"*. M. The second half is the only `codex exec` change in the window, and it adds output to a stream v32 depends on being clean.

---

## PART 5 of 6 — Gemini CLI, Devin, Factory

**GEMINI CLI**

25. **Gemini CLI ships a named subagent roster, and it is a fourth system for roster.md fact 1.** https://developers.googleblog.com/subagents-have-arrived-in-gemini-cli/, published 2026-04-15, accessed 2026-09-06. H. *"Subagents are specialized, expert agents that operate alongside your primary Gemini CLI session"*, each with *"their own set of tools, MCP servers, system instructions, and context window."* Built-in experts are named: `generalist`, `cli_help`, `codebase_investigator`. Delegation is by name — `@agent`, e.g. *"@frontend-specialist Can you review our app and flag potential improvements?"* Custom agents are Markdown with YAML frontmatter in `~/.gemini/agents` (personal) or `.gemini/agents` (project). → **v2 gains a fourth vendor**: roster.md 1 says seven of seven ship named persistent roles; this is an eighth, from a vendor roster.md did not fetch. → **§E and skills.md 11 lack a path**: `.agents/skills` is shared by Codex and Gemini CLI, but `.gemini/agents` is a *third* agent-file location beside `.claude/agents/` and Codex TOML. v42 decides one home for agent files and does not contemplate a per-provider one.

26. **The vendor states v6's rule in its own words, which makes three independent sources.** Same post, H: *"Gemini CLI supports parallel subagents, allowing you to spin off multiple subagents or many instances of the same subagent, at the same time"* — with the caution *"Multiple agents editing code at the same time can lead to conflicts and agents overwriting one another"*, and advice against parallel use for heavy code editing because of conflicts and faster rate-limit consumption. → **v6 strengthened**: roster.md cites Anthropic and Cognition. Google now says the same thing, and adds a second reason v6 does not carry — parallel subagents consume the rate limit faster, which is v22's window.

27. **Releases since 0.30 are dominated by security hardening.** https://github.com/google-gemini/gemini-cli/releases, accessed 2026-09-06. Visible: v0.60.0-nightly.20260906 (Sep 6), v0.60.0-nightly.20260905, v0.60.0-nightly.20260904, v0.59.0-preview.0 (Sep 1), v0.58.0 (Sep 1). H on the quotes: *"fix(core): enforce fail-closed workspace trust and filter mcpServers in restricted mode"*; *"fix(core): prevent SSRF in MCP OAuth metadata discovery and authentication"*; *"fix(extensions): harden path resolution and boundary validation in extension loader"*; *"fix(extensions): prompt for consent on environment changes and sanitize runtime-altering environment variables"*; *"fix(sandbox): isolate Docker and container runtime sockets and binaries in macOS Seatbelt"*. → **§H lacks a Gemini row of any kind.** models.md carries Gemini only as a price and §B.2 row 6 says *"Gemini once authenticated"*. A `restricted mode` that filters MCP servers fail-closed is the nearest analogue to `--restricted` in any third runtime.

**DEVIN** — https://docs.devin.ai/release-notes/overview, accessed 2026-09-06. M: the page was summarised by the fetch.

28. **What moved June–September 2026 is automations, not roster.** 2026-08-07: *"Automations now support queueing: set the maximum number of concurrent runs"*, with concurrency groups in the v3 API. 2026-08-26: *"Hourly schedules now have a minute selector"*. 2026-08-28: new org permission *"Manage Personal Automations"*. 2026-09-02: scheduled scans in automations by agent type. 2026-07-22: *"Automations Consumption Visibility"*, tracking ACU usage by automation session. 2026-07-15: *"Session sizes are now ACU-only"*. → **v55 partially**: Devin ships the exact shape v55 designs, plus two ceilings v55 has no mechanism for — a maximum-concurrent-runs cap per standing job, and per-automation cost attribution. v55's store check refuses `every:` without *a ceiling per run*; Devin's ceiling is per *automation*, a different cut. **NOT FOUND in the window**: parallel coordinated Devins, named agent roles, autonomy levels.

**FACTORY**

29. **Named droid types still do not exist.** https://docs.factory.ai/llms.txt, accessed 2026-09-06. The index documents *"Custom droids (subagents)"* — specialised agents with distinct system prompts, models and tool policies — and *personas* chosen during onboarding. No Code Droid / Knowledge Droid / Reliability Droid taxonomy appears. H on the negative for this index. → roster.md's *"Any 'Code Droid / Knowledge Droid / Reliability Droid' roster is UNVERIFIED"* becomes NOT FOUND on a second, different page. **v1 and v2 unaffected.**

---

## PART 6 of 6 — a measured multi-agent company, and Gaps

30. **Nothing published since 2026-06-01 measures a multi-agent company running unattended, in what I could reach.** Four findings, in descending relevance.

**(a) TheAgentCompany has not been revised, and its headline is now quoted for the first time in this corpus.** https://arxiv.org/abs/2412.14161, accessed 2026-09-06. H. Submission history: v1 2024-12-18, v2 2025-05-19, **v3 2025-09-10 — no 2026 version**. Abstract: *"The most competitive agent can complete 30% of tasks autonomously. This paints a nuanced picture on task automation with LM agents--in a setting simulating a real workplace, a good portion of simpler tasks could be solved autonomously, but more difficult long-horizon tasks are still beyond the reach of current systems."* Its six job functions, from the README (accessed 2026-09-06, H): *"Software Engineer, Product Manager, Data Scientist, Human Resource, Financial Staff, Administrator"*. → **roster.md's gap *"TheAgentCompany's headline result not obtained"* CLOSES.** → **§21 gains an outside floor: 30%**, on a fourteen-agent design whose §21 has no external comparator.

**(b) Anthropic's nearest measurement predates the window and is new to research/.** *"Measuring AI agent autonomy in practice"*, https://www.anthropic.com/research/measuring-agent-autonomy, published **2026-02-18**, accessed 2026-09-06. H. *"the 99.9th percentile turn duration nearly doubled, from under 25 minutes in late September to over 45 minutes in early January"*; *"roughly 20% of sessions use full auto-approve, which increases to over 40% as users gain experience"*; *"New users interrupt Claude in 5% of turns, while more experienced users interrupt in around 9% of turns"*. → **§C.2 lacks this**: the vendor's own 99.9th-percentile unattended stretch is **45 minutes**, not a night. Fully autonomous mode is designed above a measured ceiling three orders of magnitude below it.

**(c) The long-running-agents post is qualitative and supports v8.** *"Effective harnesses for long-running agents"*, https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents, published **2025-11-26**, accessed 2026-09-06. M, fetch-summarised; it *"contains no measured numbers"*. *"Claude tended to mark a feature as complete without proper testing"*; *"Providing Claude with these kinds of testing tools dramatically improved performance"*. → **v8 gains vendor support** for splitting self-check from the blind anchor test.

**(d) The only in-window multi-agent measurement found is not a company.** CoCoBench, https://arxiv.org/abs/2608.28266, submitted **2026-08-28**, accessed 2026-09-06. M — the fetch truncated the abstract at 125 characters, so only the finding is quoted. 897 oracle-validated instances, 11 MLLMs, four coordination constructs (task allocation, sequential ordering, mutual exclusion, handoff): *"coordination ability is highly construct-specific: strong overall performance does not imply balanced competence across different coordination types"*. Embodied agents, not software work.

**GAPS**

1. **No claim was registered.** `mcp__claim-append__append_claim` is **not in this session's tool set** — same as research/cloud.md gap 15. Durable candidates: the Fable 5.1 id and price; `--restricted`'s bypass refusal; `.gemini/agents` as an agent-file path.
2. **`code.claude.com/docs/en/schedule` returned HTTP 404.** `/schedule` is known only from three changelog fix lines; interval floor, storage and headless status UNKNOWN. runtimes.md gap 7 stays open.
3. **The Codex June 1 – August 25 window is UNREAD.** Three failures on that source, then I stopped: the changelog fetch returned no June or July entries twice; `raw.githubusercontent.com/openai/codex/main/CHANGELOG.md` is a stub pointing at releases; the releases API exceeded the 10 MB fetch limit. Whether #19945 was fixed in 0.125–0.153 is therefore UNKNOWN and was not re-checked.
4. **`docs.factory.ai/droids/overview` returned HTTP 404**; the Factory negative rests on `llms.txt` alone.
5. **Fetch fidelity.** The Codex, Devin, Factory and CoCoBench pages were summarised rather than returned whole. Short quoted strings are M there; reconstructions are the fetch's, not mine.
6. **Absence is not denial.** No vendor page states that Codex cloud lacks a creation API, or that no unattended-company measurement exists.
7. **Nothing was measured.** No runtime ran; no version was installed.

Report complete: parts 1 through 6 delivered.
