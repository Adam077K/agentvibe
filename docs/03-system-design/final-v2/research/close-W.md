# Research close — Lane W (documentary): twelve questions, verbatim return

*Lane W was dispatched 2026-09-07 on the twelve §N questions answerable from published sources.
Engine: `sourcer`. **The lane had no `Write` and no `Bash`** — `sourcer` carries only Read, Glob, Grep,
WebSearch, WebFetch — so it could not create its own return file and sent six numbered messages
instead. **This file is those six messages recorded verbatim, in arrival order, by the orchestrator.**
Nothing is summarised, compressed or re-worded here; dispositions are in DECISIONS.md §29.*

*Scope the lane reported for itself: 34 WebFetch calls and 6 WebSearch calls against vendor
documentation, licence files, raw GitHub source, the GitHub REST API and four arXiv papers. It refused
three acts the brief put out of scope — installing pixel-agents for R24's local run, calling the
Higgsfield MCP server for R21's residue, and any write, commit or push.*

**The dispatch defect, recorded because it will happen again:** `sourcer` is the right engine for
documentary research and the wrong engine for a task whose deliverable is a file. Either dispatch
`reviewer` (which has Bash) or state in the brief that the return arrives by message.

---

## Part 1 of 6 — R6

Lane W findings, part 1 of 6 — and a constraint first: I have no Write and no Bash tool, so research-W.md could not be created. My tools are Read, Glob, Grep, WebSearch, WebFetch only. All twelve answers follow in six messages; paste them into the return file if you need it on disk.

### R6 · Which inbound sources document a cursor-based polling read, and which need a listening socket?
STATUS:   ANSWERED
FINDING:  Six of the seven named door sources are readable by polling with a cursor and need no inbound bind. Notion is the only one that requires a publicly reachable endpoint and documents no change feed at all.
EVIDENCE: all accessed 2026-09-07.
- Gmail — "If your app has synchronized recently, you can perform a partial sync using the `history.list` method to return all history records newer than the `startHistoryId`." https://developers.google.com/workspace/gmail/api/guides/sync
- Calendar — "Incremental sync lets you retrieve all the resources that have been modified since the last sync request. To do this, perform a list request with your most recent sync token specified in the `syncToken` field." https://developers.google.com/workspace/calendar/api/guides/sync
- Drive — "To request the page token for the current state of the account, use the `changes.getStartPageToken`...Store and use this token in your initial call to `changes.list`." and "Notifications don't contain details about the changes. Instead, they indicate that new changes are available. To retrieve the actual changes, poll the change feed as described in Get changes." https://developers.google.com/workspace/drive/api/guides/manage-changes
- Stripe — "List events, going back up to 30 days." and `starting_after` is "A cursor for use in pagination." https://docs.stripe.com/api/events/list
- GitHub — "Events are optimized for polling with the 'ETag' header. If no new events have been triggered, you will see a '304 Not Modified' response, and your current rate limit will be untouched." Retention: "The timeline will include up to 300 events. Only events created within the past 30 days will be included." https://docs.github.com/en/rest/activity/events
- Slack — "Socket Mode allows your app to use the Events API and interactive features—without exposing a public HTTP Request URL." https://docs.slack.dev/apis/events-api/using-socket-mode/
- Notion — "It must be a secure (SSL) and publicly available endpoint. Endpoints in localhost are not reachable." https://developers.notion.com/reference/webhooks
CONFIDENCE: high
DECIDES: the world's door wakes and reads. The armed sandbox's inbound-bind denial gates none of Gmail, Calendar, Drive, Stripe, GitHub or Slack. Slack is the interesting case: it reaches parity without a bind because the socket is opened outbound.
RESIDUE: Notion alone. Its search endpoint does carry `start_cursor`/`next_cursor` and sorts by `last_edited_time`, but it is a search rather than a change log — no deletion or move events and no completeness guarantee. Smallest next act: decide whether a `last_edited_time` poll is acceptable, or relay Notion's webhook through a cloud Routine API trigger, which needs no local bind.

---

## Part 2 of 6 — R13, R14

Lane W part 2 of 6 — R13 and R14.

### R13 · Does LICENSE-CONTENT permit derivative skill bodies?
STATUS:   ANSWERED, and narrower than the question assumes.
FINDING:  CC BY 4.0 covers only the repository's OWN original content and does permit derivatives. It explicitly does not cover the imported upstream bodies, which is exactly what v17/v18 would vendor and rewrite.
EVIDENCE: all accessed 2026-09-07.
- raw LICENSE-CONTENT, https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/LICENSE-CONTENT — "Original code and tooling remain licensed under the MIT License in `LICENSE`." · "Original documentation and other non-code written content are licensed under the Creative Commons Attribution 4.0 International license unless a more specific upstream notice says otherwise." · "Third-party attributions, upstream licenses, and exceptions are tracked in `docs/sources/sources.md`."
- CC BY 4.0 §2(a)(1) grants the right to "produce, reproduce, and Share Adapted Material"; §3(a) requires you "indicate if You modified the Licensed Material and retain an indication of any previous modifications." https://creativecommons.org/licenses/by/4.0/legalcode.en
- docs/sources/sources.md lists roughly fifty upstreams. Licences appearing: MIT, Apache-2.0, BSD-3-Clause, CC-BY-SA, CC-BY, "Proprietary (official vendor skills)", "Compatible", and "Not declared upstream". One GPLv3 component was excluded on purpose: "The GPLv3 `CTF-Sandbox-Orchestrator` sidecar and runtime bootstrap scripts were intentionally not bundled."
CONFIDENCE: high on the licence text; medium on the source count, which I read as rendered rather than counting rows.
DECIDES: §I row 4 · v17 · v18. Rewriting the repo's own bodies is permitted with attribution plus a modification notice. Bulk vendoring and rewriting the imported 2,111 is NOT cleared by this file — CC-BY-SA imposes ShareAlike on any derivative, "Proprietary" grants nothing, and "Not declared upstream" is an absence of grant rather than a permission.
RESIDUE: which specific skills sit under CC-BY-SA, Proprietary or undeclared, and how many of each. Smallest next act: tally sources.md by its licence column before any import.

### R14 · Do any of the three CLIs emit a skill-activation event?
STATUS:   PARTIAL — no dedicated event in any of the three; a tool-path carrier exists in all three.
FINDING:  None of Claude Code, Codex or Gemini CLI documents a skill-activation event. Claude Code routes skill invocation through a tool named `Skill`, and PreToolUse matches on tool name, so PreToolUse is very likely the carrier — but the docs never name `Skill` as a matcher, so that step is inference, not quotation.
EVIDENCE: all accessed 2026-09-07.
- Claude Code documents 33 hook events, SessionStart through SessionEnd; none skill-specific. Matcher table: "Each event type matches on a different field: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionDenied` | tool name". Example matchers given are `Bash`, `Edit|Write`, `mcp__.*`. https://code.claude.com/docs/en/hooks
- Skills page: "Permission syntax: `Skill(name)` for exact match, `Skill(name *)` for prefix match with any arguments." https://code.claude.com/docs/en/skills
- Codex documents 12 hook events — SessionStart, SessionEnd, PreToolUse, PermissionRequest, PostToolUse, PreCompact, PostCompact, UserPromptSubmit, SubagentStart, SubagentStop, Stop, Interrupt — none skill-specific. https://learn.chatgpt.com/docs/hooks
- Gemini CLI telemetry defines `gemini_cli.tool_call`, `gemini_cli.slash_command`, `gemini_cli.extension_enable`, `gemini_cli.extension_disable`; no skill-activation event. https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/cli/telemetry.md
CONFIDENCE: high on the absence; medium on the PreToolUse carrier.
DECIDES: O41 is instrumentation unless the `Skill` matcher fires, in which case it is a field lookup.
RESIDUE: one measured cell — register a PreToolUse hook with matcher `Skill`, invoke a skill, see whether it fires. Lane C or M shaped; I have no shell.

---

## Part 3 of 6 — R15, R16

Lane W part 3 of 6 — R15 and R16. R15 is the one that should change something today.

### R15 · Is there a published measurement of selection accuracy as installed-skill count rises?
STATUS:   ANSWERED — yes, two independent measurements, agreeing in direction.
FINDING:  Degradation is measured, not speculative, and it becomes statistically significant at about 102 skills. This repo already carries 134 (W40), so it is past the measured threshold today.
EVIDENCE: both accessed 2026-09-07.
- "More Skills, Worse Agents? Skill Shadowing Degrades Performance When Expanding Skill Libraries", arXiv:2605.24050v2, 23 Jun 2026, Hongwen Song and Song (Vinson) Wei. Abstract verbatim: "Skill libraries allow LLM agents to load task-specific instructions on demand, letting non-expert users solve domain-specific tasks through natural language without knowing which skills exist or how they work. However, performance degrades as libraries grow—by up to 21% when scaling from a small set of helpful skills to a 202-skill library." Libraries tested 52, 102, 202; pass-rate drop 0.08 (95% CI 0.02–0.15), 0.14 (0.09–0.19), 0.21 (0.15–0.27). Degradation becomes statistically significant at 102. https://arxiv.org/html/2605.24050
- "Demystifying Agent Skills: Why They Work—Until They Don't", arXiv:2608.14036v1, 14 Aug 2026. "as pools grow from 5 to 100, actual-use precision falls from 29.6% to 3.3%". Also "from 88.3% at pool size 5 to 76.9% at pool size 100" for top-1 embedding precision, "from 70.0% to 63.7%" for explicit agent selection, and on similar-distractor pools "from 70.5% at k=5 to 53.4% at k=100". Pool sizes 5, 10, 20, 50, 100. https://arxiv.org/html/2608.14036v1
CONFIDENCE: high
DECIDES: v77. The budget is no longer the only thing bounding the exposure — there is now an outside measurement, and it puts the knee an order of magnitude below the 2,111 import. The second paper also names the mechanism: semantically similar skills competing for selection, which is what a bulk import of overlapping upstreams produces.
RESIDUE: neither paper tests beyond 202 skills. Extrapolation to 2,111 is unsupported by either. Nobody has measured that size.

### R16 · Does any shipped agent system carry a scheduling object between the goal and the run?
STATUS:   ANSWERED — two of three carry two objects; one carries three.
FINDING:  Symphony and Linear both go goal → run with no scheduling object between. GitHub Copilot is the exception: its agent task is a distinct persistent object with its own id and a `queued` state.
EVIDENCE: all accessed 2026-09-07.
- OpenAI Symphony SPEC.md — the issue is itself the schedulable thing: "Normalized schedulable work item used by orchestration, prompt rendering, and observability output." Then "Run Attempt" — "One execution attempt for one issue" — and "Workspace" — "Filesystem workspace assigned to one issue identifier". Scheduling is a loop, not an object: "At startup, the service validates config, performs startup cleanup, schedules an immediate tick, and then repeats every `polling.interval_ms`", whose tick is "Reconcile running issues. Run dispatch preflight validation. Fetch candidate issues from tracker using active states. Sort issues by dispatch priority. Dispatch eligible issues while slots remain." Workspaces outlive runs: "Workspaces are reused across runs for the same issue. Successful runs do not auto-delete workspaces." https://raw.githubusercontent.com/openai/symphony/main/SPEC.md
- Linear — "[Agent Session] tracks the lifecycle of a given agent task. Sessions are created automatically when an agent is mentioned or delegated an issue." Objects are issue, agent session, agent activity. Event-driven, no time-based object. https://linear.app/developers/agents
- GitHub Copilot — a task is created and listed independently of any issue via `POST /agents/repos/{owner}/{repo}/tasks`, `GET /agents/tasks`, `GET /agents/repos/{owner}/{repo}/tasks/{TASK-ID}`, and carries states "queued", "in_progress", "completed", "failed", "idle", "waiting_for_user", "timed_out", "cancelled". https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api
CONFIDENCE: high for Symphony and Linear; medium for Copilot, whose docs never state the task/session relationship in one sentence — I read it off the endpoint shape and the state list.
DECIDES: O1's shape. Two objects is the majority shape among shipped systems and is defensible. The one system that ships three does so to carry a queue across a network boundary between the caller and the runner, which this design does not have.
RESIDUE: none material. Symphony's retry-queue state is the nearest thing to a third object and it is backoff bookkeeping, not a durable work row.

---

## Part 4 of 6 — R18, R20, R21

Lane W part 4 of 6 — R18, R20, R21. R21 inverts the current O32 assignment.

### R18 · Is there measured evidence for a re-attempt ceiling across sessions?
STATUS:   PARTIAL — measured evidence exists for retry ceilings, but within a context, not across sessions.
FINDING:  The measured marginal yield of retries is small and the naive independence model badly overstates it. The paper's clean-restart arm is what a new session is, and it is strictly better than a contaminated retry.
EVIDENCE: "Why Retrying Fails: Context Contamination in LLM Agent Pipelines", arXiv:2605.08563v1, 8 May 2026, accessed 2026-09-07. Abstract: "When an LLM agent fails a multi-step tool-augmented task and retries, the failed attempt typically remains in its context window—contaminating the next attempt and elevating the per-step error rate beyond the base level." On SWE-bench Verified: "pass@1=0.761, pass@3=0.812". "the IID model overestimates pass@3 by 17.4 percentage points (98.6% vs. 81.2%)". "Context-clearing before retry strictly reduces required attempts; the exact improvement ratio is derived", with "improvement ratio ≈1.21—same budget resolves 21% more tasks". https://arxiv.org/html/2605.08563
CONFIDENCE: high on the numbers; medium on transferring them to across-session re-attempts, which the paper does not test.
DECIDES: O73's N. Three attempts buy about 5 points on that benchmark (0.761 → 0.812). N=3 has measured support; N above 3 has none that I found. The finding also cuts in the design's favour: because a new session starts clean, an across-session re-attempt is the arm the paper shows is better, so the ceiling argument supports across-session retries rather than opposing them.
RESIDUE: no paper found measuring across-session re-attempt yield specifically. Searched arXiv for pass@k ceilings, retry patterns, and RLVR exploration.

### R20 · Has anyone published a roster-size ablation between six and one hundred and fifty?
STATUS:   ANSWERED as NOT FOUND. This is the finding, not a failure to look.
FINDING:  Not found after searching TheAgentCompany (paper, GitHub README and site), Google ADK, LangGraph templates, Sakana, Cognition and Factory roster material, AgentArch, MegaAgent, MultiAgentBench and the arXiv multi-agent scaling literature. No published ablation varies roster size across the 6–150 range.
EVIDENCE: the closest measured curve is "Scaling Behavior of Single LLM-Driven Multi-Agent Systems", arXiv:2606.00655v1, 30 May 2026, accessed 2026-09-07 — "we vary the number of agents n from 1 to 8 in increments of 1". Largest N tested is 8. Its conclusions: "MAS performance does not scale monotonically with agent count but follows a pattern of diminishing returns, governed by a trade-off between collaborative synergy and coordination overhead" and "task type critically modulates the optimal agent count". Per-domain examples given: Philosophy peaks at "98.04% (n=4,6)"; Formal Logic "declined substantially from 58.82% (1 agent) to 25.49%". https://arxiv.org/html/2606.00655
TheAgentCompany's leaderboard remains UNOBTAINED — second recorded failure. the-agent-company.com/#/leaderboard is a client-rendered single-page app and returned only the page title to a text fetch on 2026-09-07; the GitHub README links the leaderboard rather than containing it.
CONFIDENCE: high on the absence within what is fetchable; the 1–8 curve is quoted.
DECIDES: v31 cannot responsibly be moved by external evidence in either direction. The only measured curve stops at 8 and says more agents is not monotonically better, which is directionally consistent with a small roster but does not reach the question.
RESIDUE: the leaderboard needs a JavaScript-rendering fetch. Designer or Lane C shaped with Playwright; WebFetch cannot reach it.

### R21 · Does any credit-spending server expose a spend or balance read?
STATUS:   ANSWERED, split — and the split runs opposite to §F's current assignment.
FINDING:  RunPod exposes a full balance and spend read. Higgsfield does not document one at all.
EVIDENCE: both accessed 2026-09-07.
- RunPod GraphQL spec, `myself` — `clientBalance` (Float), `currentSpendPerHr` (Float), `minBalance` (Float), `underBalance` (Boolean), `clientLifetimeSpend` (Float), `spendLimit` (Int), `creditAlertThreshold` (Float), plus `spendDetails` and `dailyCharges`. https://graphql-spec.runpod.io/
- Higgsfield's own FAQ points only at the web dashboard: "You can monitor your API usage, credit consumption, and request history through the Higgsfield Cloud dashboard." No balance or credit endpoint is documented. https://docs.higgsfield.ai/docs/help/faq
CONFIDENCE: high for RunPod; high for the absence in Higgsfield's published docs.
DECIDES: O32 — and it inverts the pair. §F admits Higgsfield under a cap and refuses RunPod for uncapped spend, but on R21's own test RunPod is the one a program can hold an absolute ceiling against and Higgsfield is the one it cannot. On the stated rule, Higgsfield belongs in REACHES-THE-WORLD.
RESIDUE: a secondary source claims the Higgsfield MCP server exposes balance and per-model pricing as tools. I did not call it — the brief forbids authenticating or spending, and I did not want to guess at whether a tool listing crosses that line. Smallest next act, for whoever holds that call: a `tools/list` read against the configured Higgsfield MCP server, which spends nothing.

---

## Part 5 of 6 — R24, R25

Lane W part 5 of 6 — R24 and R25. Both contain a correction to something the plan currently asserts.

### R24 · Does pixel-agents render ten venture areas and fifty live agents, and what is its AgentEvent schema and ingest rate?
STATUS:   PARTIAL — schema and ingest answered from source; the render claim needs the local run the question names, which is an install I refused.
FINDING:  There is no `AgentEvent` type in the pixel-agents source. The README's phrase names a model the code does not define. Areas are real. Nothing caps agents or areas anywhere in the source.
EVIDENCE: all accessed 2026-09-07, repo pixel-agents-hq/pixel-agents at main.
- README: "The Claude provider normalizes both sources into a shared `AgentEvent` model." and "Layouts can grow to 64×64 tiles by clicking the ghost border outside the current grid."
- `core/src/messages.ts` defines no `AgentEvent`. The actual wire model is a message union: ProviderCapabilities, AgentCreated, AgentClosed, AgentSelected, ExistingAgents, AgentStatus, AgentToolStart, AgentToolDone, AgentToolsClear, AgentToolPermission, AgentToolPermissionClear, SubagentToolStart, SubagentToolDone, SubagentClear, SubagentToolPermission, AgentTeamInfo, AgentContextUsage, LayoutLoaded, FurnitureAssetsLoaded, CharacterSpritesLoaded, PetSpritesLoaded, FloorTilesLoaded, WallTilesLoaded, CarpetTilesLoaded, SettingsLoaded, HooksStatus, HooksConsentRequest, ExternalAssetDirectoriesUpdated, AreaMappingsLoaded, WorkspaceFolders, AgentDiagnostics.
- `core/src/schemas.ts` defines PersistedAgent, AgentMeta, ColorValue, PlacedFurniture, FloorColor, OfficeLayout, SpriteData, FurnitureCatalogEntry, HookEvent, Disposable — again no `AgentEvent`.
- Areas exist as first-class: `AreaMappingsLoaded` on the server side, `SaveAreaMappings` and `SetShowAreas` on the client side.
- Ingest is poll-based, from `server/src/constants.ts`: JSONL_POLL_INTERVAL_MS = 1000, FILE_WATCHER_POLL_INTERVAL_MS = 500, PROJECT_SCAN_INTERVAL_MS = 1000, EXTERNAL_SCAN_INTERVAL_MS = 3000, LAYOUT_FILE_POLL_INTERVAL_MS = 2000, HOOK_EVENT_BUFFER_MS = 5000, MAX_HOOK_BODY_SIZE = 65536.
- No constant in `core/src/constants.ts` or `server/src/constants.ts` caps agents, seats, areas or grid size. The only numeric limits in core are display truncations, BASH_COMMAND_DISPLAY_MAX_LENGTH = 30 and TASK_DESCRIPTION_DISPLAY_MAX_LENGTH = 40.
CONFIDENCE: high on the type names and constants, which I read from raw source; the render question is unmeasured.
DECIDES: v62's UNVERIFIED, partly. The writer §14.4 says is ours to build must target the message union above, because the type it is currently specified against does not exist. Ten areas and fifty agents are not forbidden by any constant, but nothing demonstrates them either.
RESIDUE: the local run. Installing pixel-agents is an install and the brief forbids it — BLOCKED, and the act needed is: whoever may install runs it, seeds ten areas and fifty agents, and counts. Everything else here came from source.

### R25 · What are /schedule's semantics — interval floor, storage, headless status?
STATUS:   ANSWERED. The doc that 404'd is not where the answer lives.
FINDING:  `/schedule` is the CLI entry point to cloud Routines, not a local scheduler. One-hour interval floor, stored on the claude.ai account, runs headless with the laptop closed, and has no access to local files.
EVIDENCE: code.claude.com/docs/en/schedule returned HTTP 404 again on 2026-09-07 — third recorded failure, and it is a dead path, not a transient one. The content is at /docs/en/routines and /docs/en/scheduled-tasks, both accessed 2026-09-07.
- "Routines are available on Pro, Max, Team, and Enterprise plans. Create and manage them at claude.ai/code/routines, or from the CLI with `/schedule`."
- "Run `/schedule` in any session to create a scheduled routine conversationally."
- "The minimum interval is one hour; expressions that run more frequently are rejected."
- "Routines execute on Anthropic-managed cloud infrastructure, or on your organization's self-hosted environment when routed there, so they keep working when your laptop is closed."
- The comparison table's Cloud column: requires machine on No · requires open session No · persistent across restarts Yes · access to local files "No (fresh clone)" · customizable schedule "Via `/schedule` in the CLI" · minimum interval 1 hour.
- "`/schedule` requires a claude.ai subscription login." and "API accounts aren't supported for routines."
- Timing is staggered, not exact: "Runs may start a few minutes after the scheduled time due to stagger. The offset is consistent for each routine."
CONFIDENCE: high
DECIDES: O52 and v55. `/schedule` runs headless and is untouched by the Mac sleeping, because it never runs on the Mac — so the catch-up question does not arise for it. But "No (fresh clone)" disqualifies it for v55's Watch-dispatched standing intents, which need this machine's files. Route those to a Desktop scheduled task, not to `/schedule`.
RESIDUE for O52, and I closed it while I was there — the Desktop scheduler coalesces exactly as O52 feared. From /docs/en/desktop-scheduled-tasks, accessed 2026-09-07: "Tasks only run while the desktop app is running and your computer is awake. If your computer sleeps through a scheduled time, the run is skipped." and "When the app starts or your computer wakes, Desktop checks whether each task missed any runs in the last seven days. If it did, Desktop starts exactly one catch-up run for the most recently missed time and discards anything older. A daily task that missed six days runs once on wake." Its floor is 1 minute, it needs no open session, and tasks live at `~/.claude/scheduled-tasks/<task-name>/SKILL.md`. Also relevant to R41: there is a "Keep computer awake" setting under Desktop app → General, and "Closing the laptop lid still puts it to sleep." For contrast, `/loop` does not catch up at all: "No catch-up for missed fires" and "Recurring tasks automatically expire 7 days after creation."

---

## Part 6 of 6 — R26, R40, summary, scope

Lane W part 6 of 6 — R26, R40, the summary table and scope notes. R40 is the one that kills a route.

### R26 · Was #19945 fixed between Codex 0.125 and 0.153?
STATUS:   PARTIAL — no evidence of a fix, and the window is only partly readable.
FINDING:  The issue is open today and nothing in the readable changelog or PR history addresses it. R10 is not settled by this route.
EVIDENCE: all accessed 2026-09-07.
- Issue open. Title verbatim: "codex exec silently crashes with no output when stdio is detached from TTY (0.124.0+)". State open, created 2026-04-28T07:51:53Z, never closed. Confirmed twice, via the issue page and via api.github.com/search/issues.
- The three earlier fetch failures had a cause: developers.openai.com/codex/changelog returns 308 to learn.chatgpt.com/docs/changelog. The page is readable there.
- Codex CLI entries visible on it run 0.149.0 through 0.153.4. The two TTY-adjacent entries name a different issue: v0.153.0 (2026-09-03) and v0.150.0 (2026-08-26) "Prevent Unix shutdown hangs caused by detached processes retaining a terminal or full terminal output buffers" (#40460); v0.152.0 (2026-09-01) "Respond to terminal queries from TTY subprocesses" (#41436). Neither is #19945.
- Asked twice for June and July 2026 Codex CLI entries: there are none on that page. So 0.125–0.148 stays unread — the window is empty on the source rather than unfetched.
- PR search for detached and 19945 returned nine merged PRs, none addressing the defect. Two adjacent ones are "Deprecate detached review delivery" (#42602) and "Stabilize the detached exec-server session resume test" (#42306).
CONFIDENCE: high on "no evidence of a fix"; medium on "was not fixed" — an open issue is not proof, and a fix can land without a reference.
DECIDES: R10 does not get its cheap route. v32 stands as written.
RESIDUE: the local rehearsal — five known-answer cases on the installed binary, detached, with a non-trivial prompt. Lane C shaped and needs Codex installed.

### R40 · Do Google's terms permit automated access through the Gemini CLI on a personal account?
STATUS:   ANSWERED, and the answer moots the terms question.
FINDING:  The route does not exist. Google withdrew personal-account access to the Gemini CLI on 2026-06-18. Separately, Google's general terms contain no blanket ban on automated access — the clause is narrow and conditional.
EVIDENCE: all accessed 2026-09-07.
- developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals — "Starting June 18, 2026, Gemini Code Assist IDE extensions stopped serving requests for the Gemini Code Assist for individuals, Google AI Pro, and Google AI Ultra tiers." · "This also applies to usage of Gemini CLI." · "As part of the deprecation, you can no longer use the Login with Google option to access the IDE extensions or Gemini CLI." · "Users of Gemini Code Assist consumer accounts on both Gemini Code Assist IDE extensions and Gemini CLI can migrate to the Antigravity family of products." · "No, access to Gemini Code Assist IDE extensions and Gemini CLI using Gemini Code Assist Standard or Enterprise subscriptions remain unchanged."
- On the terms themselves, policies.google.com/terms restricts only "using automated means to access content from any of our services in violation of the machine-readable instructions on our web pages (for example, robots.txt files that disallow crawling, training, or other activities)". Conditional on robots.txt, materially unlike §G.5's Anthropic clause, which bans automated access outright except by API key.
- ai.google.dev/gemini-api/terms carries no clause forbidding scripted or agent-driven use. Its one relevant constraint is regional: "You may use only Paid Services when making API Clients available to users in the European Economic Area, Switzerland, or the United Kingdom."
CONFLICT, recorded rather than resolved: the gemini-cli README still advertises "Sign in with Google" with "Free tier: 60 requests/min and 1,000 requests/day". Two Google sources disagree. The deprecation page is the more specific and the more recent, and I did not verify the README's freshness.
CONFIDENCE: high on the deprecation; high on the terms quotes; medium on the conflict's resolution.
DECIDES: v90 · E7 · §I row 1. The second family via Gemini CLI on a personal account is not a live route, and the reason is availability, not terms. This is upstream of W37's sandbox EPERM finding and stronger than it.
RESIDUE: the Antigravity CLI's terms and whether it has a personal-account tier are unread, and that is now the live question standing where v90 was. The Gemini API key path is a different product whose terms I did read and which forbids nothing relevant.

## Summary
| id | status | one line |
|---|---|---|
| R6 | ANSWERED | Gmail, Calendar, Drive, Stripe, GitHub poll with a cursor; Slack needs no bind via outbound WebSocket; Notion alone needs a public endpoint |
| R13 | ANSWERED | CC BY 4.0 permits derivatives of the repo's OWN content only; the imported upstreams include CC-BY-SA, Proprietary and undeclared, so bulk rewrite is not cleared |
| R14 | PARTIAL | No skill-activation event in any of the three; `Skill` is a real tool and PreToolUse matches tool names, so the carrier is likely but unquoted |
| R15 | ANSWERED | Measured: 21% pass-rate drop at 202 skills, significant from 102. This repo is at 134 |
| R16 | ANSWERED | Symphony and Linear ship two objects; Copilot ships three, with a queued task |
| R18 | PARTIAL | pass@1 0.761 → pass@3 0.812; a clean restart beats a contaminated retry by ~21%. Across-session yield unmeasured |
| R20 | NOT FOUND | No 6–150 roster ablation exists. Largest measured curve is n=1..8. Leaderboard still unobtained, second failure |
| R21 | ANSWERED | RunPod exposes clientBalance and spend; Higgsfield documents no balance read — the opposite of §F's assignment |
| R24 | PARTIAL | `AgentEvent` does not exist in the source; areas do; no cap on agents or areas; ingest polls at 1s |
| R25 | ANSWERED | `/schedule` is cloud Routines: 1h floor, account-stored, headless, no local files. Desktop scheduler coalesces missed runs to exactly one |
| R26 | PARTIAL | No fix. Issue open; changelog has no June–July Codex entries; no PR addresses it |
| R40 | ANSWERED | The route is dead since 2026-06-18, not restricted by terms. Google's automated-access clause is narrow |

## Scope notes
What I ran: 34 WebFetch calls and 6 WebSearch calls against vendor documentation, licence files, raw GitHub source, the GitHub REST API and four arXiv papers. Nothing else.
What I refused: installing pixel-agents for R24's local run; calling the Higgsfield MCP server for R21; any write, commit or push. I have no Write and no Bash tool, so research-W.md does not exist — this message set is the return.
Two questions turned on a redirect or a dead path rather than on their subject: R25's doc 404s permanently and its content lives at two other pages, and R26's three prior failures were a 308 nobody followed. Both are recorded as source facts.
Single-family caveat: every judgement here is mine alone, one agent, one model family. Four findings contradict something the plan currently asserts — R21 inverts O32's pair, R24 says a named type does not exist, R40 removes v90's route, and R15 puts this repo past a measured threshold. Each rests on a quoted primary source, and each deserves a second read before it moves a row.
