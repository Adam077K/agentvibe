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
