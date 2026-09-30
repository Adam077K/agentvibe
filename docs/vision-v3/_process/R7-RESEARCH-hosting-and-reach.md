# R7 — Research: where the agents may run, and how the system reaches the founder's phone

*Researched 2026-09-30. Sources accessed 2026-09-30 unless a date is given. Anything not backed by an official page is labelled **[secondary]** or **[UNVERIFIED]**. This is research, not legal advice.*

---

## Q1 — Where may the agents run?

### Short answer

The belief that "subscription agents must run on the Mac because of Anthropic policy" is **too strong, but it points the right way**. No official document ties a Pro/Max login to a particular machine, and Anthropic ships first-party ways to run Claude Code on the subscription on its own cloud and in CI. What the terms do restrict is **who** uses the login (only the account holder), **how** it is used ("ordinary, individual usage" through Anthropic's own clients), and **reselling or relaying it**. OpenAI is similar, and says more directly that API keys are the recommended way to run automation.

The practical rule: **the subscription-authenticated agent processes belong on the founder's own machine, or on the vendor's own cloud (Claude cloud sessions/routines, Codex cloud)**. Self-hosted cloud VMs or CI running his personal login are a grey zone: tolerated by the documentation, not endorsed. Everything that does not hold a subscription credential (UI, DB, queue, scheduler, webhooks, notification relay) can live anywhere.

### (a) Anthropic / Claude Code

| Finding | Source |
|---|---|
| Pro/Max users are governed by the **Consumer Terms**. | [code.claude.com/docs/en/legal-and-compliance](https://code.claude.com/docs/en/legal-and-compliance) |
| Consumer Terms (effective 2025-10-08), §3 prohibits: *"Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise."* | [anthropic.com/legal/consumer-terms](https://www.anthropic.com/legal/consumer-terms) |
| §2: *"You may not share your Account login information … You also may not make your Account available to anyone else."* | same |
| *"Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK."* OAuth is *"intended exclusively for purchasers of … subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications."* Developers may not *"route requests through Free, Pro, or Max plan credentials on behalf of their users"* or *"collect, store, or intermediate Claude.ai credentials."* Anthropic *"may [enforce] without prior notice."* | [legal-and-compliance](https://code.claude.com/docs/en/legal-and-compliance) |
| **Explicit permission for scripted use exists.** `claude setup-token` makes a one-year OAuth token, which you set as `CLAUDE_CODE_OAUTH_TOKEN`, *"For CI pipelines, scripts, or other environments where interactive browser login isn't available … This token authenticates with your Claude subscription."* | [code.claude.com/docs/en/authentication](https://code.claude.com/docs/en/authentication) |
| **`claude -p` / Agent SDK on the subscription is currently allowed.** Update of 2026-06-16: *"For now, nothing has changed: Claude Agent SDK, `claude -p`, and third-party app usage still draw from your subscription's usage limits."* A separate SDK credit pool (announced for 2026-06-15, also covering GitHub Actions) was **paused**, and Anthropic *"will share an update before anything takes effect."* | [support.claude.com/…/15036540](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) |
| **Anthropic's cloud runs on the subscription.** Cloud sessions (claude.ai/code, mobile, `claude --cloud`) are available on Pro/Max, and *"share rate limits with all other Claude and Claude Code usage … There is no separate compute charge for the cloud VM."* Parallel `--cloud` sessions are documented as supported. *"Cloud sessions always use your subscription credentials."* | [claude-code-on-the-web](https://code.claude.com/docs/en/claude-code-on-the-web), [authentication](https://code.claude.com/docs/en/authentication) |
| **Routines** (schedule, API `/fire` webhook, GitHub events) run on Anthropic cloud and *"draw down subscription usage the same way interactive sessions do"*. Caps: 100 scheduled runs per hour per account, 30 Run-now or API fires per hour per routine, minimum interval 1 hour. Research preview. | [code.claude.com/docs/en/routines](https://code.claude.com/docs/en/routines) |
| **Remote Control** runs the session *"directly on your machine"*. The phone and web are only a window onto it. Pro/Max only, API keys not supported. | [code.claude.com/docs/en/remote-control](https://code.claude.com/docs/en/remote-control) |
| Multiple accounts on one machine are supported through `CLAUDE_CONFIG_DIR`. Nothing found limits parallel sessions beyond shared rate limits. | [authentication](https://code.claude.com/docs/en/authentication) |

**Where Anthropic is ambiguous:** the consumer-terms ban on "automated or non-human means" sits beside docs that explicitly offer `setup-token` for "CI pipelines, scripts". The docs count as "where we otherwise explicitly permit it", so scripted use **by the account holder, for himself**, reads as permitted. No document mentions a VPS or "must be your own device". The limit is "ordinary, individual usage", so a 24/7 parallel headless fleet on a rented server could be judged beyond it, without notice. **[UNVERIFIED: no official statement either way on a self-rented VPS.]**

### (b) OpenAI / Codex

| Finding | Source |
|---|---|
| Codex is included in ChatGPT plans (Plus, Pro, etc.) with no separate subscription **[secondary]**. The official pricing page returned 403. | [chatgpt.com/codex/pricing](https://chatgpt.com/codex/pricing/) (blocked); [morphllm.com](https://www.morphllm.com/codex-pricing) |
| Headless login is documented: device-code login (`codex login --device-auth`, must first be enabled in ChatGPT security settings) or copying `~/.codex/auth.json` to the headless machine. *"Treat `~/.codex/auth.json` like a password."* *"API keys are still the recommended default for automation."* | [learn.chatgpt.com/docs/auth](https://learn.chatgpt.com/docs/auth) |
| **ChatGPT-login Codex in CI is officially documented, with conditions:** only if *"the runner is trusted private infrastructure"*, you can keep the refreshed `auth.json` between runs, and *"only one machine or serialized job stream will use a given `auth.json` copy."* **"Do not use this for public repositories."** Described as *"an advanced workflow for enterprise and other trusted private automation."* | [learn.chatgpt.com/docs/auth/ci-cd-auth](https://learn.chatgpt.com/docs/auth/ci-cd-auth) |
| `codex exec` is the non-interactive mode for CI and scheduled jobs, and reuses saved CLI auth **[secondary; the official page 404'd at fetch time]**. | [developersdigest.tech](https://www.developersdigest.tech/blog/codex-exec-ci-headless-guide) |
| Codex **Remote** (ChatGPT mobile app, shipped 2026-05-14 per secondary sources) steers sessions whose host is the ChatGPT desktop app on macOS/Windows *or an SSH host*. The agent executes on the host. | [learn.chatgpt.com/docs/remote-connections](https://learn.chatgpt.com/docs/remote-connections) |
| OpenAI Terms of Use: users *"may not share your account credentials or make your account available to anyone else"* and may not *"automatically or programmatically extract data or Output."* Quoted via search snippet; the page itself returned 403. | [openai.com/policies/row-terms-of-use](https://openai.com/policies/row-terms-of-use/) |

**Where OpenAI is ambiguous:** the Terms prohibit "programmatically extract data or Output", yet OpenAI's own docs ship `codex exec` and a CI recipe for ChatGPT-login auth. The reasonable reading is that the first-party Codex CLI is a sanctioned client. The one-`auth.json`-per-machine-or-serialized-stream rule is a hard technical and policy line: **do not run parallel Codex workers from one copied `auth.json` on several machines.**

### (c) Conclusion: what runs where

| Component | Where | Why |
|---|---|---|
| Claude Code and Codex CLI processes on the founder's personal subscriptions (interactive, `claude -p`, `codex exec`, parallel worktrees) | **Founder's Mac** (primary) | Squarely "ordinary, individual" first-party use. Keychain-stored credentials never leave the machine. Remote Control and Codex Remote both assume this model. |
| Overflow and "laptop closed" agent work | **Vendor clouds:** Claude cloud sessions / routines, Codex cloud tasks | First-party, on the subscription, officially documented. The cost is shared rate limits. |
| Same agents on a rented VPS or CI runner with his login (`CLAUDE_CODE_OAUTH_TOKEN`, copied `auth.json`) | **Grey zone. Avoid as the default.** | Documented as mechanically supported (setup-token; trusted private CI for Codex) but not endorsed for personal plans at fleet scale. If used: one private machine he controls, never a public repo, one serialized stream per `auth.json`, never shared. |
| Web UI (Mission Control), DB (Supabase), job queue / scheduler (Inngest), webhooks, notification relay | **Anywhere in the cloud** | Holds **no** subscription credential, so the subscription terms are not engaged. The cloud side should only **enqueue**: the Mac pulls the work (outbound polling, the same pattern Remote Control uses) and runs the agent locally. A Claude routine's `/fire` token is a routine-scoped trigger token, not a login, so a cloud scheduler may hold it. |
| Anything that proxies other people's requests through his subscription | **Nowhere** | Explicitly banned by both vendors. |

**Correction to the founder's belief:** the constraint is not "Mac only". It is **"the credential stays with me and with the vendor's own clients, and only I use it."** The Mac is the cleanest place to satisfy that. The vendors' own clouds satisfy it too.

---

## Q2 — Free ways to reach the founder's phone

### (a) Native vendor push

- **Claude.** When Remote Control is active, *"Claude can send push notifications to your phone"*. It *"typically sends one when a long-running task finishes or when it needs a decision from you"*. Turn it on in `/config` with **Push when Claude decides** and/or **Push when actions required** (permission prompts and questions). You can also ask in the prompt ("notify me when tests finish"). The Mac must stay on with `claude` running. Pushes are skipped while you are focused on the terminal (`CLAUDE_CLIENT_PRESENCE_FILE` extends this), and iOS Focus modes can suppress them. **A local agent triggers it through a Remote-Control-enabled session. There is no public API to push arbitrary events.** Cloud sessions are also viewable from the mobile app. Source: [remote-control §Mobile push notifications](https://code.claude.com/docs/en/remote-control).
- **Claude hooks** give a programmatic trigger for any local session: the `Notification` hook fires on `permission_prompt`, `idle_prompt`, `agent_needs_input`, `agent_completed`, and others, and can run any command (for example `curl` to ntfy or Pushover). A `Stop` hook fires when Claude finishes. Source: [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks).
- **Claude Channels** (research preview): an official Telegram/Discord/iMessage plugin that bridges chat to a local session in both directions. Source: [code.claude.com/docs/en/channels](https://code.claude.com/docs/en/channels).
- **Codex / ChatGPT app.** The docs promise *"Get notified when ChatGPT completes a task or needs your attention"* for Remote hosts ([remote-connections](https://learn.chatgpt.com/docs/remote-connections)). Open GitHub issues report pushes **not delivered on iOS** in background ([#32908](https://github.com/openai/codex/issues/32908), [#33300](https://github.com/openai/codex/issues/33300)), so treat it as unreliable. Codex CLI `notify` in `~/.codex/config.toml` runs a program on `agent-turn-complete` only, **not on approval requests** **[secondary: [backgrind.com](https://backgrind.com/blog/codex-cli-notifications/)]**.

**Neither vendor push is a wake-at-night channel.** It is best-effort, OS-Focus-suppressible, and tied to the vendor session.

### (b) Programmatic channels, ranked

| Rank | Channel | Cost | Reliability | Wakes him at night? | Source |
|---|---|---|---|---|---|
| 1 | **Pushover**, priority 2 (emergency) | Free 30-day trial, then **$4.99 one-time** per platform. 10,000 msgs/month free on the API | High, commercial | **Yes.** iOS Critical Alerts approved by Apple (2020) *"bypass the device's mute switch and Do Not Disturb"*. Emergency priority repeats every ≥30 s until acknowledged (expire ≤3 h). | [pushover.net/api](https://pushover.net/api), [blog.pushover.net](https://blog.pushover.net/), [licensing](https://pushover.net/licensing) |
| 2 | **ntfy** (ntfy.sh or self-hosted), priority 5 | **Free:** 250 msgs/day, 0 phone calls. Paid from $6/mo includes 3 calls **[secondary for tiers]** | Good. Android instant delivery via foreground service | **Android: yes** if you set the priority-5 channel to override DND. **iOS: no Critical Alerts found [UNVERIFIED]** | [docs.ntfy.sh/subscribe/phone](https://docs.ntfy.sh/subscribe/phone/), [docs.ntfy.sh/publish](https://docs.ntfy.sh/publish/), tiers via [toolradar](https://toolradar.com/tools/ntfy) |
| 3 | **Telegram bot message** (Bot API, or Claude Channels) | Free | High delivery | **Weak.** Normal push, silenced by DND. Allowing Telegram through iOS Focus is the only lever | [channels](https://code.claude.com/docs/en/channels) |
| 4 | **CallMeBot → Telegram voice call** (TTS) | Free (donation-ware) **[UNVERIFIED limits]** | **Low to medium.** Unofficial, not part of the Telegram API, no SLA | Rings like a Telegram call, subject to Focus settings | [callmebot.com](https://www.callmebot.com/blog/telegram-phone-call-api/) |
| 5 | **Twilio voice call** | Trial: free units (e.g. 75 voice minutes), **verified recipients only**, **"SMS and voice are limited to your sign-up country"**. After the trial, pay-as-you-go (Israeli mobile per-minute rate **[UNVERIFIED]**) | High carrier-grade | **Yes** if the number is in Favorites / Emergency Bypass. Repeated calls also break through iOS DND by default **[UNVERIFIED for current iOS]** | [twilio.com/docs/…free-trial](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account) |

### (c) Recommended zero-or-near-zero reach stack

1. **Mac, at the desk:** Claude `Notification` + `Stop` hooks and Codex `notify` → macOS notification. Free.
2. **Mission Control web** (cloud, no credentials): the inbox of record. Every event that needs him writes a row there, and every other channel only deep-links to it.
3. **Phone, routine:** Claude Remote Control push ("Push when actions required") for Claude sessions, plus **ntfy free** (priority 3–4) from the hooks and the cloud relay for everything, including Codex. Cost: $0.
4. **Phone, urgent / wake at night:** **Pushover emergency priority (2) with iOS Critical Alerts**, repeating until acknowledged. **$4.99 once.** This is the one paid item and the only verified free-or-near-free path that beats DND on iOS. If the phone is Android, ntfy priority 5 with a DND-override channel covers this for $0.
5. **Emergency call fallback (optional):** if a Pushover emergency is unacknowledged after N minutes, the cloud relay places a **Twilio call** (a few cents per call after the trial; the trial will not reach an Israeli number unless he signed up in Israel) or a CallMeBot Telegram call (free, unreliable). Keep the escalation logic in the cloud relay so it works while the Mac is asleep. It needs no subscription credential.

---

## What remains uncertain

- Whether Anthropic treats personal Pro/Max use on a **self-rented VPS or CI**, at fleet scale, as "ordinary, individual usage". No official statement. The Agent SDK / `claude -p` billing model is **paused, not settled**, and may change with notice.
- OpenAI's pricing and ToU pages returned 403, so the Codex plan inclusions and ToU quotes are from search snippets and secondary sources. The `codex exec` official page 404'd.
- Codex mobile push reliability (open iOS bugs), and whether Codex `notify` now covers approvals.
- ntfy iOS Critical Alerts support. ntfy.sh paid-tier call quotas (secondary).
- Twilio: current per-minute price to Israeli mobiles, and whether a non-Israel trial can call an Israeli verified number.
- CallMeBot limits and terms (unofficial service).
