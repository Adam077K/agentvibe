# Review — Professional advisor (opus, web research first, read-only)

**Verdict:** The guardrails are sound, but the economics and the outreach channel rest on provider terms that either forbid what the plan does (Resend) or have changed three times this year (Claude subscriptions). The main risk is still time: this would be a fourth month of harness work with no venture ever run through it. Shrink the build to one week and put a real venture on the calendar before any runner code.

(Read: README, 01, 07, 08 in full; 02 §7–9 and 03 skimmed. Research done first; sources below.)

## The 5 biggest risks

**1. Personal time and opportunity cost (business). Likelihood: very high.**
- CLAUDE.md: "no venture work has ever run through this harness" after Phases 1–8 and ~2 months of commits. v2 adds ~30 harness jobs (J00–J29) plus a fleet census/plugin layer (J11/J12); acceptance (M1) comes at the end. Day-90 targets (≥5 merged changes per venture per week; 2 ventures + 2 projects at ≤6 h/week) are aspirations written as metrics. R1 relies on a self-set 3-week timebox; every earlier phase had exit criteria and drifted anyway.
- **Do:** start M1 discovery this week by hand, no runner — ten conversations need a calendar, a consent line and a notes file, not SQLite. Build only what the calls prove painful. Make the timebox external: tell another person the date; J29 not landing by it is a stop, not a slip.

**2. Claude subscription terms don't clearly cover unattended runner use (provider terms). Likelihood: medium–high.**
- Anthropic consumer terms forbid access "through automated or non-human means, whether through a bot, script, or otherwise" except with an API key "or where we otherwise explicitly permit it". The Claude Code legal page: OAuth is "designed to support ordinary use of Claude Code"; Pro/Max limits "assume ordinary, individual usage of Claude Code and the Agent SDK".
- `claude -p` is supported and currently draws from subscription limits, "until further notice": 4 April 2026 third-party agent use banned; 13 May a metered "Agent SDK credit" ($20–$200/month) announced; 15 June paused. A launchd runner with 2 concurrent writers, nightly jobs and a 60%-of-window budget is exactly what that credit scheme meters.
- **Do:** budget as if the credit scheme returns — price the automated share at API rates today and delete "$0 marginal model cost" from 01. Keep automation founder-initiated where possible. "Helpers later" must mean separate seats; terms bar making an account "available to anyone else".

**3. Client/NDA and interviewee data on consumer plans (legal/data). Likelihood: unknown; high impact if yes.**
- Anthropic: since the August 2025 terms, Pro/Max chats and coding sessions train by default unless opted out, with up to 5-year retention; even after opt-out, safety-flagged material or feedback can be used. OpenAI: Plus/Pro train by default unless "Improve the model for everyone" is off; Codex follows ChatGPT data controls. Consumer terms give no DPA → EU interviewee transcripts are a GDPR processor gap. Local whisper.cpp doesn't cure it: scoring and synthesis send the text to the models. D12's "check the provider's terms" is too soft.
- **Do:** turn off training on both accounts today and screenshot it. Rule: no client/NDA code or identifiable interviewee data through a consumer plan — use API or Team/Business (commercial terms), or pseudonymise first. Read your NDAs for "no disclosure to third-party processors".

**4. The outbound channel conflicts with vendor policy and law (compliance/reputation). Likelihood: high if executed as written.**
- The plan uses Resend for "outbound batch" to ICP lists (03; D10). Resend AUP, verbatim: "You are prohibited from sending unsolicited messages of any kind, including cold outreach, purchased lists, or scraped contact data… All mail must be sent to recipients who have explicitly opted in." That is a terms breach with suspension risk, not just reputation (R8).
- Gmail/Yahoo require SPF/DKIM/DMARC and <0.3% spam rate; fresh per-venture domains without warm-up land in spam. CAN-SPAM requires opt-out and a physical address; GDPR/PECR and, if in Israel, the Communications Law's prior-consent rule make cold B2C email risky.
- **Do:** Resend for waitlist and lifecycle email only. Discovery outreach as low-volume personal 1:1 emails from your own mailbox, drafted by agents, sent by you. A one-hour legal opinion on the jurisdictions you'll email. "No LinkedIn/Reddit automation" is correct (LinkedIn User Agreement §8.2 bans bots and scrapers).

**5. Codex as the second model family is fragile (provider terms/technical). Likelihood: medium.**
- OpenAI docs: "API keys are the right default for automation"; ChatGPT-managed auth for scripts/CI is "advanced", aimed at enterprise tokens. The plan runs `codex exec` on a ChatGPT login through a PTY wrapper working around detached-use bug #19945 — unsupported behaviour for that auth mode. Usage token-metered since April 2026; Pro $200 sign-ups reportedly paused 10 September 2026 (secondary, low confidence). The whole "two model families" claim (R3, the 2026-11-17 waiver exit) depends on this path.
- **Do:** put the reviewer on an OpenAI API key with a hard monthly cap (e.g. $30). Reviews are small; it removes the PTY hack and the terms question.

## Where the plan's assumptions conflict with actual terms
| Plan assumption | Provider reality |
|---|---|
| "$0 marginal model cost; all model work on the two subscriptions" (01) | Anthropic: automated access only via API key or explicit permission; limits assume ordinary individual use; SDK/`-p` metering announced and only paused |
| Outbound batches via Resend (03, D10) | Resend AUP bans cold outreach outright |
| Codex on ChatGPT login as the unattended judge (D6, 02 §8) | OpenAI recommends API keys for automation; ChatGPT auth for scripts is enterprise "advanced" |
| "Helpers later" on the founder's setup (01) | Both consumer terms bar sharing accounts or credentials |
| Transcripts are local, so private (03) | Only transcription is local; scoring and synthesis send text to consumer models with training on by default |
| "No subscription credentials in CI until terms confirmed" (D7) | Right instinct — apply the same test to launchd on the Mac; it is also unattended |

The plan gets right: consent script before recording (Otter.ai wiretap claims allowed to proceed 13 August 2026; 11–12 US states require all-party consent), no social automation, agents moving no money.

## Verify personally this week
1. **D12 in writing today** — any client/NDA code or customer personal data touching either subscription? If yes, stop that flow now.
2. **Training settings** — turn off "Help improve Claude" and "Improve the model for everyone"; screenshot both.
3. **Billing pages (D5)** — record exact plan names and whether extra usage/overflow is on; turn it off.
4. **The venture (D1/D2)** — name it and book the first 5 discovery calls. This is the real acceptance test.
5. **Outbound channel** — drop Resend for cold email; personal 1:1 sending; list jurisdictions.
6. **Budget line** — a hard monthly API cap (Anthropic and OpenAI) for everything unattended; accept it isn't zero.
7. **Build timebox (D3)** — cut from 3 weeks to 1: queue + launch + status for one engine only.
8. **Branch protection / `enforce_admins`** — a 5-minute setting only you can change, carried as risk since August.

## Stop doing
- **Writing about the system.** CLAUDE.md is ~40 KB of superseded notes and provenance essays; do the 8 KB cut in an hour.
- **Treating harness correctness as company progress.** Nine-PR waves fixing CI-parser bypasses are well done and worth close to zero customers.
- **Designing for the day-90 fleet** (trust ladders, fleet census, plugin distribution, improvement loop, cost split) before one venture has ten conversations.
- **Gating a solo pre-revenue founder's own tooling** with multi-judge irreversible-tier ceremony. Waive it until first revenue.
- **Building on whatever the subscription allows today.** Price the automated part as API spend; treat subscription usage as a bonus.

## Sources (accessed 2026-09-29)
1. Anthropic Consumer Terms — https://www.anthropic.com/legal/consumer-terms
2. Claude Code legal and compliance — https://code.claude.com/docs/en/legal-and-compliance
3. Claude Help Center, Agent SDK with a Claude plan — https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan
4. VentureBeat, Anthropic reinstates third-party agent usage — https://venturebeat.com/technology/anthropic-reinstates-openclaw-and-third-party-agent-usage-on-claude-subscriptions-with-a-catch
5. Anthropic, consumer terms and privacy update — https://www.anthropic.com/news/updates-to-our-consumer-terms
6. OpenAI Codex docs — https://developers.openai.com/codex/noninteractive, https://developers.openai.com/codex/auth
7. OpenAI data controls — https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt (via search summary; direct fetch 403)
8. Resend Acceptable Use Policy — https://resend.com/legal/acceptable-use
9. Gmail sender guidelines — https://support.google.com/a/answer/14229414
10. LinkedIn prohibited software — https://www.linkedin.com/help/linkedin/answer/a1341387
11. Otter.ai wiretap case; all-party consent states — https://www.layer3labs.io/guides/otter-ai-lawsuit, https://www.layer3labs.io/guides/two-party-consent-states
12. Codex pricing / Pro sign-up pause (secondary, low confidence) — https://www.morphllm.com/codex-pricing

Caveats: not legal advice; email, GDPR and Israel points need a qualified lawyer. OpenAI's terms page returned 403, so OpenAI claims come from developer docs and search summaries. Plan files 04–06 not read.
