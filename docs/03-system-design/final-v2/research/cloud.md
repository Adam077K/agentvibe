# Research lane · the cloud lane when the Mac is off — Codex cloud tasks · 2026-09-05

*Recorded verbatim by the orchestrator from the sourcer lane's numbered parts (delivery truncates near 4,000 characters per message). Facts only; the decision is SPINE v56. Question: what a Codex cloud task is, whether one can be created programmatically, plans and quotas, sandbox and network, resume/cancel/poll, terms, and the Anthropic and Google contrast.*

---

## PART 1 of 5 — What a Codex cloud task is (Q1)

All access dates 2026-09-05. Confidence marked H/M/L. Note on sourcing: `developers.openai.com/codex/*` 308-redirects to `learn.chatgpt.com/docs/*`; I followed the redirects and quote the targets.

**Headline.** Codex cloud tasks are real, hosted, and run off your machine. The thing your question turns on is weaker than the product itself: **no vendor page I could reach prints a non-interactive command or an HTTP endpoint for creating one.** Detail in part 2.

**Where it runs.** *"Run tasks in isolated cloud environments."* That sentence is the entire vendor claim about the runtime. No container or sandbox technology is named anywhere on the page. <https://learn.chatgpt.com/docs/cloud> · H on the quote; the absence is itself a finding.

**Repo access.** *"Connect GitHub or GitLab."* For GitHub you *"choose the repositories Codex can access"*; for GitLab you *"select a project when you create the environment."* Access is bound to an **environment**, a saved configuration that exists before any task runs. <https://learn.chatgpt.com/docs/cloud> · H

**What the environment carries.** *"Configure any dependencies, tools, environment variables, or secrets the task needs."* Dependency installation and secrets are environment setup, not per-task arguments. <https://learn.chatgpt.com/docs/cloud> · H

**How long it may run.** Not documented. The page distinguishes *"longer tasks"* as receiving *"dedicated environments"* but states no maximum runtime, and no page I reached states one. UNKNOWN. The phrase is L; the absence is H.

**What it produces.** A summary and a diff, with a pull request as an optional next step rather than the default artifact: *"Review the summary and diff. Ask Codex to make follow-up changes, or open a pull request."* <https://learn.chatgpt.com/docs/cloud> · H

**How results are delivered.** Five documented surfaces.

- The Codex web interface, where you read the summary and diff. H
- A GitHub or GitLab pull request, opened by your action. H
- A review posted on the pull request, when the task came from `@codex review`. It posts *"a review on the pull request, just like a teammate would"*, flagging P0 and P1 issues; a security review posts *"security findings directly on the pull request"* plus a *"Security Report"* tab. <https://learn.chatgpt.com/docs/third-party/github> · H
- Slack, when triggered there. Codex reacts with an emoji and will *"reply with a link to the chat. When it finishes, Codex posts the result."* <https://learn.chatgpt.com/docs/third-party/slack> · H
- Your local checkout, by applying the diff from the terminal. See part 2.

**Naming.** Newer pages call these "cloud chats" rather than "cloud tasks". The pricing page uses that word in the one sentence that bears on quota: *"Cloud chats on ChatGPT plans use GPT-5.6 Sol and may use more of your allowance than local messages."* <https://learn.chatgpt.com/docs/pricing> · M, because that page was summarized by the fetch rather than quoted whole.

Parts 2 to 5 cover: programmatic creation and the key negative finding; plans, quotas, sandbox and network policy; resume, cancel and poll, plus the terms refusal; and finally the Anthropic and Google contrast, what this changes against `parts/10`, and the gaps list.

---

## PART 2 of 5 — Creating a cloud task without a human in the ChatGPT UI (Q2)

**The key finding, stated first.** No OpenAI page I reached documents a REST API for creating a Codex cloud task, and no vendor page prints a non-interactive CLI invocation for one. The vendor CLI reference describes the cloud entry point as a browser, not as argv: `codex cloud` lets you *"Browse active and completed chats, submit work to a configured environment, and apply the result to your local repository from the terminal."* <https://learn.chatgpt.com/docs/codex/cli> · H on the quote, H on the absence across the six pages I fetched.

**A non-interactive command does appear, but only in an OpenAI repository issue, not in the docs.** Issue openai/codex#24777, *"Add scriptable Codex Cloud environment and task lifecycle management"*, open, created 2026-05-27, labels `CLI` and `enhancement`. It lists these as already existing:

```
codex cloud exec --env ENV_ID "..."
codex cloud list --env ENV_ID --json
codex cloud status TASK_ID
codex cloud diff TASK_ID
codex cloud apply TASK_ID
```

Its complaint is the shape of your problem exactly: automation *"currently has to open the interactive `codex cloud` TUI or web UI, find an environment manually, copy an opaque ID, and paste it into scripts."* It says the gap blocks *"reliable multi-repo dispatch, CI integration, and agent-driven workflows."* <https://github.com/openai/codex/issues/24777> · **M**, not H: the author is not confirmed to be an OpenAI maintainer, no maintainer reply is visible, and the command list is the author's assertion about the binary rather than documentation.

**Requested and therefore absent, per the same issue:** `codex cloud env list`, `env resolve --repo owner/repo`, `env get`, `codex cloud exec --repo owner/repo`, `codex cloud wait`, `codex cloud logs`, `codex cloud message`, `codex cloud output`, and `env create/update/delete/pin/unpin`. M.

**GitHub trigger, and it is the only human-free path with vendor documentation.** Manual: *"In a pull request comment, mention `@codex review`. Wait for Codex to react (👀) and post a review."* Automatic: enable in Codex settings so *"Codex will post a review whenever someone opens a new PR for review, without needing an `@codex review` comment."* Other work uses `@codex` plus a request, for example `@codex fix the CI failures`. Configuring automatic reviews needs *"GitHub push or admin permission for its settings."* <https://learn.chatgpt.com/docs/third-party/github> · H. **No label trigger is documented.** I looked and found none.

**Slack trigger.** *"Mention `@Codex` and include your prompt."* You can target a repo in the prompt: `@Codex fix the above in openai/codex`. Setup needs a plan, a connected GitHub account, at least one environment, the Slack app installed, and `@Codex` added to the channel; *"an admin may need to approve the install."* <https://learn.chatgpt.com/docs/third-party/slack> · H

**The GitHub Action is not a cloud task, and this distinction matters.** `openai/codex-action@v1` *"installs the Codex CLI, starts the Responses API proxy when you provide an API key, and runs `codex exec`"*. It runs local Codex on a GitHub runner against `OPENAI_API_KEY`. It is a fully programmatic lane, but it is CI compute, not OpenAI's hosted sandbox. <https://learn.chatgpt.com/docs/github-action> · H

**Automations.** The vendor page calls them scheduled tasks, not Automations. *"You can create and update scheduled tasks from a ChatGPT or Codex chat."* Intervals: *"minute-based intervals for active follow-up loops, or daily and weekly schedules."* No programmatic creation path is documented, and the page does not say whether a scheduled task can start a cloud task. <https://learn.chatgpt.com/docs/automations> · M

---

## PART 3 of 5 — Auth and plans (Q3), sandbox and network policy (Q4)

**Which plans include cloud tasks.** The pricing page lists Codex across Free, Go at $8 per month, Plus at $20, Pro, Business at $20 per user, Enterprise and Edu, plus an API key path. <https://learn.chatgpt.com/docs/pricing> · M, because that page came back summarized rather than quoted whole. The sharper gate is a direct quote from the Slack page, and it is narrower than the pricing list: *"You need a Plus, Pro, Business, Enterprise, or Edu plan...a connected GitHub account, and at least one environment."* <https://learn.chatgpt.com/docs/third-party/slack> · H. Read together, **cloud chats are not on Free or Go**, while local Codex is.

**Quota, and the honest answer is that no numeric cloud figure is published.** The one sentence that bears on it: *"Cloud chats on ChatGPT plans use GPT-5.6 Sol and may use more of your allowance than local messages."* <https://learn.chatgpt.com/docs/pricing> · M. That is qualitative. The published numbers are for **local messages per five-hour window**, not cloud:

| Model | Plus | Pro 5x | Pro 20x |
|---|---|---|---|
| GPT-5.6 Sol | 10–100 | 50–500 | 200–2,000 |
| GPT-5.6 Terra | 25–200 | 125–1,000 | 500–4,000 |
| GPT-5.6 Luna | 250–2,000 | 1,250–10,000 | 5,000–40,000 |

Same URL · M on the figures, because the table was reconstructed by the fetch. The enterprise page adds no cloud figure: it says only that admin controls *"aren't a universal Codex limit system"* and that *"Depending on the plan, this can include some Codex activity."* <https://learn.chatgpt.com/docs/enterprise/usage-limits> · M.

**Overage.** *"ChatGPT Plus and Pro users who reach their usage limit can purchase additional credits to continue working."* Same pricing URL · M.

**API key path.** It exists and is documented as *"Pay for Codex usage based on API pricing"*, usage-billed instead of allowance-billed. H that it exists. **But nothing documents an API key as a way to create a cloud task.** The documented API-key surface is local `codex exec` and the GitHub Action from part 2. The two paths do not meet in any page I read.

**Internet access inside a cloud task, and the default is the useful fact.** *"By default, Codex blocks internet access during the agent phase."* <https://learn.chatgpt.com/docs/cloud/internet-access> · H.

**Allowlist.** Three presets: None, described as an empty allowlist to build from scratch; Common dependencies, a preset list; and *"All (unrestricted)"*. Domains can be added beyond a preset. Settings are per environment. H.

**Method restriction.** You can *"restrict network requests to `GET`, `HEAD`, and `OPTIONS`"*, which blocks POST, PUT, PATCH and DELETE. H.

**Risks the vendor names for itself**, quoted because they read as a threat model rather than marketing: *"Prompt injection from untrusted web content"*, *"Code or secret exfiltration"*, *"Downloading malware or vulnerable dependencies"*, and *"Pulling in content with license restrictions"*. Mitigation as written: *"allow only the domains and HTTP methods you need, and review the agent output and work log."* H.

**Secrets and dependencies.** Both are environment configuration, not task input: *"Configure any dependencies, tools, environment variables, or secrets the task needs."* <https://learn.chatgpt.com/docs/cloud> · H.

**One inference, flagged as such.** The phrase *"during the agent phase"* implies a separate earlier phase where dependency installation happens under a different network rule. That reading is consistent with dependencies being environment setup, but no page states the two-phase model explicitly. M on the inference, H on the quoted phrase.

---

## PART 4 of 5 — Resume, cancel and poll (Q5); the terms question (Q6)

**Polling appears possible, and the citation is the weaker kind.** Three of the five commands the issue lists as existing are read operations: `codex cloud status TASK_ID`, `codex cloud diff TASK_ID`, and `codex cloud list --env ENV_ID --json`. The `--json` flag on `list` is the one that matters for a driver, since it implies machine-readable output. <https://github.com/openai/codex/issues/24777> · **M**, for the reason given in part 2: this is an issue author's assertion about the binary, unconfirmed by any vendor page and with no maintainer reply.

**Applying a result locally is documented in the same list:** `codex cloud apply TASK_ID`. M. The vendor CLI page corroborates the capability without printing the command, describing `codex cloud` as letting you *"apply the result to your local repository from the terminal."* <https://learn.chatgpt.com/docs/codex/cli> · H on that quote.

**Blocking wait, log streaming, follow-up messaging and structured output are all absent.** The same issue requests `codex cloud wait TASK_ID`, `codex cloud logs TASK_ID`, `codex cloud message TASK_ID` and `codex cloud output TASK_ID`. A feature request is evidence the feature is missing, so this is the firmer half of that source. M to H.

**Cancel is unknown.** No cancel command appears in either the existing list or the requested list, and no vendor page mentions cancelling a cloud task. I found nothing either way. UNKNOWN, and I will not guess.

**Follow-ups are documented as a user interface action, not a command:** *"Ask Codex to make follow-up changes."* <https://learn.chatgpt.com/docs/cloud> · H.

**Does `codex exec resume` apply? Nothing says it does.** The prior lane's file records `codex exec resume --last | <SESSION_ID>` from <https://learn.chatgpt.com/docs/non-interactive-mode>, and that page is about local non-interactive sessions. No page I read connects `codex exec resume` to a cloud task, and the two surfaces use different nouns throughout: `SESSION_ID` for local exec, `TASK_ID` for cloud. Treat as **not applicable until shown otherwise**. M on the negative.

**Terms: I did not obtain them, and I am not going to substitute a remembered clause.**

Every OpenAI policy URL refused me:

| URL | Result |
|---|---|
| `openai.com/policies/row-terms-of-use` | HTTP 403 |
| `openai.com/policies/eu-terms-of-use/` | HTTP 403 |
| `openai.com/policies/business-terms/` | HTTP 403 |

With the prior lane's HTTP 403 on `openai.com/policies/terms-of-use`, that is four refusals against one host across two dates. My own rule is to stop after three failures on the same source and return the gap, so I stopped. **The OpenAI half of the terms question is UNKNOWN.** No clause about automated or programmatic use of a ChatGPT subscription has been read by this session or the previous one.

**What can be said factually, and what it is not.** OpenAI documents and ships automation surfaces that run on a subscription rather than an API key: the Slack app, the GitHub `@codex` mention, and automatic pull request review on PR open, all covered in part 2. Separately it documents an API-key path billed at API pricing. **Documented product behaviour is not a terms clause.** A vendor shipping a feature does not tell you what its terms permit, and reading it that way is exactly the substitution I am refusing to make. L on any inference; H only on the fact that the features are documented.

**For contrast, the Anthropic clause is already on file** in this session's runtimes research, quoted from the Consumer Terms section 3, prohibiting access *"through automated or non-human means"* except via an API key or *"where we otherwise explicitly permit it."* I did not re-fetch it today and I am not restating it as new evidence.

---

## PART 5 of 5 — Contrast (Q7), what this changes against parts/10, gaps

**Anthropic, Claude Code on the web.** <https://code.claude.com/docs/en/claude-code-on-the-web> · H. Research preview for Pro, Max, Team, and Enterprise premium seats. *"each session runs in an isolated, Anthropic-managed VM."* Creation is documented argv, not a UI: `claude --cloud "Fix the authentication bug in src/auth/login.ts"`. *"The cloud VM clones your current directory's GitHub remote at your current branch, not your local checkout."* Parallelism is explicit: *"each `--cloud` command creates its own cloud session that runs independently."* Follow-ups from any machine: `claude -p "your message" --cloud <session-id>`, with `--output-format json` returning `{ok, session_id, url}`. Pull back with `claude --teleport <session-id>`; monitor with `/tasks`. Duration: *"Cloud sessions stop after a period of inactivity and the session's VM is reclaimed"*, no number. Quota: *"shares rate limits with all other Claude and Claude Code usage within your account... There is no separate compute charge for the cloud VM."*

**Anthropic, Routines.** <https://code.claude.com/docs/en/routines> · H. *"Routines execute on Anthropic-managed cloud infrastructure... so they keep working when your laptop is closed."* Three triggers: schedule, API, GitHub. The API trigger is a quoted endpoint, which is the thing Codex lacks:

```
POST https://api.anthropic.com/v1/claude_code/routines/trig_.../fire
Authorization: Bearer sk-ant-oat01-xxxxx
anthropic-beta: experimental-cc-routine-2026-04-01
{"text": "..."}
```

Returns `{"type":"routine_fire","claude_code_session_id":...,"claude_code_session_url":...}`. Token creation is web-only: *"The CLI cannot currently create or revoke tokens."* Schedule floor: *"The minimum interval is one hour; expressions that run more frequently are rejected."* Pro, Max, Team, Enterprise. Blocked hosts fail with `403` and `x-deny-reason: host_not_allowed`. Sharp caveat, quoted: *"A green status in the run list means the session started and exited without an infrastructure error. It does not mean the task in your prompt succeeded."*

**Google, Jules.** *"Jules runs in a virtual machine where it clones your code, installs dependencies, and modifies files"* <https://jules.google/docs> · H. API base `https://jules.googleapis.com/v1alpha/`; create by POST to `/sessions` with `prompt`, `sourceContext`, optional `automationMode`; auth is *"pass the API key in the `X-Goog-Api-Key` header"*; outputs carry a `pullRequest` object. *"The Jules API is in an alpha release, which means it is experimental."* Only quota found: *"You can have at most 3 API keys at a time."* <https://developers.google.com/jules/api> · H

**What this changes against parts/10**

1. Section 10.5's Codex column has **no cloud row at all**. A hosted Codex lane exists.
2. Section 10.2's *"one foreground slot is not parallel"* does not govern cloud tasks. Issue #19945 is a **local** `codex exec` TTY defect and cannot apply to work running in OpenAI's sandbox. Whether a local dispatcher hits it depends on whether `codex cloud exec` shares the local exec code path. UNKNOWN.
3. Section 10.5's *"second checker family: yes in principle, blocked by #19945"* is narrower than stated. The `@codex review` route needs no local Codex.
4. Section 10.5's Claude Code column has no `--cloud` or `--teleport` row. Both are documented argv today.
5. Section 10.5's Routines row: the one-hour minimum is **confirmed verbatim**; the daily cap is confirmed to exist but published as no number. The *"no local files (fresh clone)"* cell is right about the laptop and misleading if read as "no repository" — routines clone every selected repo per run and push `claude/`-prefixed branches.
6. Section 10.7's ABSENT rows are untouched. Nothing here is built.

**Gaps** (delivered as part 5b after the lane's part 5 truncated mid-sentence).

1. **OpenAI terms are unread.** Four HTTP 403 refusals against `openai.com/policies/*` across two dates: `terms-of-use` (prior lane), `row-terms-of-use`, `eu-terms-of-use/`, `business-terms/`. Question 6 is UNKNOWN for OpenAI. No clause has been read.
2. **Codex cloud maximum task duration is undocumented.** No page I reached states a runtime limit.
3. **No vendor page prints `codex cloud exec` argv.** The command list is from openai/codex#24777, whose author is not confirmed as an OpenAI maintainer and has no maintainer reply. Confidence M, not H.
4. **No REST API for creating a Codex cloud task was found.** This is absence of evidence across six fetched pages, not a vendor denial. A private or undocumented endpoint may exist.
5. **No GitHub label trigger for Codex is documented.** Only `@codex` mention and automatic review on pull request open.
6. **Cancelling a Codex cloud task is unknown.** No cancel command appears in either the existing or the requested list, and no page mentions one.
7. **Whether `codex exec resume` reaches a cloud task is unknown.** Nothing links the two, and the surfaces use different nouns: `SESSION_ID` locally, `TASK_ID` in the cloud.
8. **No numeric cloud quota is published.** The only cloud statement is qualitative: cloud chats *"may use more of your allowance than local messages."* The published five-hour figures are for local messages.
9. **Codex cloud container technology is unnamed.** *"Isolated cloud environments"* is the entire vendor claim.
10. **The two-phase network model is my inference,** from the phrase *"during the agent phase."* No page states it.
11. **Anthropic publishes no numeric inactivity timeout** for cloud sessions and no numeric daily routine cap. Both are described only qualitatively.
12. **Jules task quotas and the CLI were not fetched.** The docs reference a "Jules Tools (CLI)" section I did not open, and the only quota found was the three-API-key limit.
13. **Fetch fidelity.** The `learn.chatgpt.com` `.md` pages were summarized by the fetch model rather than returned whole. Short quoted strings are H; reconstructed tables and figures are M.
14. **Nothing was measured.** No runtime ran. Codex remains uninstalled and I attempted no install, per the brief.
15. **No claims were registered.** `mcp__claim-append__append_claim` was not present in this session's tool set, so durable findings could not be written to the ledger. Whoever has that tool should register at minimum the internet-access default, the routines API endpoint and its one-hour floor, and the absence of a documented Codex cloud creation API, each with a `valid_until` date.

**Report complete: parts 1 through 5 and 5b delivered.**
