# Lane · models and quotas · 2026-09-05

All rows fetched today from the vendor's own page unless marked UNVERIFIED. 25 fetches spent; failures named at the end.

## Questions answered

Catalogue and API price: Anthropic **complete**, OpenAI **complete**, Google **complete**. Subscription plan prices: all three **fetched**. Published *numeric* subscription quotas: **only OpenAI publishes them**; Anthropic publishes windows without numbers; Google publishes CLI free-tier numbers only. `--max-budget-usd` **exists and is print-mode only**. Cost-per-task across CLIs: **no vendor source found**, third-party only.

## Anthropic

Source for every row: <https://platform.claude.com/docs/en/about-claude/pricing> and <https://platform.claude.com/docs/en/about-claude/models/overview>, accessed 2026-09-05, confidence **H**.

| Model | API id | In / Out $/MTok | Cache read | Cache write 5m / 1h | Context | Max out | Batch in/out |
|---|---|---|---|---|---|---|---|
| Fable 5.1 | `claude-fable-5-1` | 10 / 50 | **0.25** | 12.50 / 20 | 1M | 128K | 5 / 25 |
| Mythos 5.1 (limited) | — | 10 / 50 | 0.25 | 12.50 / 20 | — | — | 5 / 25 |
| Opus 5 | `claude-opus-5` | 5 / 25 | 0.50 | 6.25 / 10 | 1M | 128K | 2.50 / 12.50 |
| Sonnet 5 | `claude-sonnet-5` | 2 / 10 | 0.20 | 2.50 / 4 | 1M | 128K | 1 / 5 |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | 1 / 5 | 0.10 | 1.25 / 2 | 200K | 64K | 0.50 / 2.50 |
| Fable 5 (legacy) | `claude-fable-5` | 10 / 50 | 1.00 | 12.50 / 20 | — | — | 5 / 25 |
| Opus 4.8 / 4.7 / 4.6 / 4.5 (legacy) | — | 5 / 25 | 0.50 | 6.25 / 10 | — | — | 2.50 / 12.50 |
| Sonnet 4.6 / 4.5 (legacy) | — | 3 / 15 | 0.30 | 3.75 / 6 | — | — | 1.50 / 7.50 |

Quoted, and each one bites:

1. *"Cache hits and refreshes on Claude Fable 5.1 and Claude Mythos 5.1 are priced at 0.025x the base input price. All other models use the standard 0.1x multiplier."*
2. *"5-minute cache write | 1.25x base input price"*; *"1-hour cache write | 2x base input price"*.
3. *"Claude 4.7 and later models and Claude Mythos Preview use a newer tokenizer … This tokenizer produces approximately 30% more tokens for the same text."* Opus 5, Fable 5.x are on it; **Sonnet 4.6 and earlier are not**.
4. *"The $2/$10 … pricing for Claude Sonnet 5 … is now the standard price. The previously scheduled increase to $3/$15 … on September 1, 2026 will not occur."*
5. Retirement: Fable 5.1 *"Not sooner than September 1, 2027"*; Opus 5 *"July 24, 2027"*; Sonnet 5 *"June 30, 2027"*; **Haiku 4.5 *"Not sooner than October 15, 2026"*** — six weeks out.
6. Batch: *"a 50% discount on both input and output tokens"*; *"Batch API and prompt caching discounts can be combined."*
7. Fast mode: Opus 5 / 4.8 only, $10 in / $50 out, *"not available with the Batch API"*.
8. `inference_geo: "us"` applies **1.1x** on all token categories.
9. Web search **$10 per 1,000 searches**; web fetch **no additional charge**; code execution **1,550 free hours/month** then $0.05/hour/container.

**Plans** — <https://claude.com/pricing>, accessed 2026-09-05.

| Plan | Price | Published limit | Conf |
|---|---|---|---|
| Free | $0 | no numbers given | H |
| Pro | *"$20 if billed monthly"* · *"$17 per month with annual"* ($200 up front) | *"at least 5x more usage per 5-hour session than Free"* | H |
| Max 5x | *"From $100 per month"* | *"5x more usage than Pro per 5-hour session"* | M |
| Max 20x | *"From $100 per month"* | *"20x more usage than Pro per 5-hour session"* | **L** — page rendered the same "$100" for both tiers; treat the Max 20x price as UNVERIFIED |
| Team Standard | $25/mo, $20/seat annual | exceeds Pro | M |
| Team Premium | $125/mo, $100/seat annual | *"5x more usage than standard seats"* | M |
| Enterprise | *"$20/seat. Usage cost scales with model and task"* | — | M |

**Windows and caps** — <https://code.claude.com/docs/en/costs>, accessed 2026-09-05, **H**:

- *"each member's Claude Code usage draws from a per-seat allowance that resets on a rolling five-hour window and a weekly window. The allowance is shared with Claude chat and Cowork"*.
- Two limit shapes, and they behave differently: *"'You've hit your session limit' or 'You've hit your weekly limit': a seat-based usage window … shared across all models, so the developer can't restore access by switching models with `/model`. After the model-specific 'You've hit your Opus limit' or 'You've hit your Sonnet limit' message, switching to a model outside that family with `/model` does keep the developer working."*
- Cache TTL, which §5.2 and §14.5 both rest on: *"The lifetime is an hour on a subscription and drops to five minutes once you're drawing on usage credits; on an API key or cloud provider, it's five minutes by default."*
- Cost anchors: *"the average cost is around $13 per developer per active day and $150-250 per developer per month, with costs remaining below $30 per active day for 90% of users."*
- Agent teams: *"Agent teams use approximately 7x more tokens than standard sessions when teammates run in plan mode"*; *"Use Sonnet for teammates."*

**Per-run cap** — <https://code.claude.com/docs/en/cli-reference>, **H**. `--max-budget-usd`: *"Maximum dollar amount to spend on API calls before stopping (print mode only). Spend from subagents counts toward the cap. Once spend reaches the cap, spawning another subagent fails with `Budget limit reached` … requires Claude Code v2.1.217 or later."* It is a **local computation against list price**, not a billing control: *"Claude Code computes the dollar figure locally from token counts at list price"*, and for subscribers *"the session cost figure isn't relevant for billing purposes."* Subscription spend caps exist only via usage credits (`/usage-credits`, monthly spend limit) and, on Team/Enterprise, admin spend limits.

## OpenAI

<https://developers.openai.com/api/docs/pricing>, accessed 2026-09-05, **H**. $/MTok.

| Model | Input | Cached input | Output |
|---|---|---|---|
| gpt-6-astra | 10.00 | 1.00 | 50.00 |
| gpt-5.6-sol | 4.00 | 0.40 | 20.00 |
| gpt-5.6-terra | 2.00 | 0.20 | 12.00 |
| gpt-5.6-luna | 0.20 | 0.02 | 1.20 |
| gpt-5.5 / gpt-5.5-pro | 5.00 / 30.00 | 0.50 / — | 30.00 / 180.00 |
| gpt-5.4 / -mini / -nano / -pro | 2.50 / 0.75 / 0.20 / 30.00 | 0.25 / 0.075 / 0.02 / — | 15.00 / 4.50 / 1.25 / 180.00 |
| **gpt-5.3-codex** | **1.75** | **0.175** | **14.00** |
| gpt-5.2 / gpt-5.1 / gpt-5 | 1.75 / 1.25 / 1.25 | 0.175 / 0.125 / 0.125 | 14.00 / 10.00 / 10.00 |
| gpt-5-mini / gpt-5-nano | 0.25 / 0.05 | 0.025 / 0.005 | 2.00 / 0.40 |

Cached input is **0.1x** input across the line — the same ratio Anthropic charges for everything except Fable 5.1.

**Codex plans** — <https://learn.chatgpt.com/docs/pricing> (redirected from developers.openai.com/codex/pricing), accessed 2026-09-05, **H**. Free $0 · Go $8 · Plus $20 · Pro *"From $100/month (5x or 20x higher rate limits)"* · Business $20/user/month (2+ users, annual) · Enterprise/Edu contact sales. **OpenAI is the only vendor of the three that publishes numeric per-window quotas:**

| Model | Plus | Pro 5x | Pro 20x |
|---|---|---|---|
| GPT-6 Astra | 5–45 | 25–225 | 100–900 |
| GPT-5.6 Sol | 10–100 | 50–500 | 200–2,000 |
| GPT-5.6 Luna | 250–2,000 | 1,250–10,000 | 5,000–40,000 |

*"Codex usage resets on a 5-hour rolling window for local messages."* *"GPT-5.6 usage averages 5-30 credits per message."* Overage credits per MTok: Astra 250 in / 1,250 out; Sol 100 / 500; Luna 5 / 30.

## Google

**Gemini CLI** — <https://raw.githubusercontent.com/google-gemini/gemini-cli/main/README.md>, accessed 2026-09-05, **H** for the free numbers: *"60 requests/min and 1,000 requests/day with personal Google account"*, access to Gemini 3 models with a 1M context window; API-key route *"1000 requests/day with Gemini 3 (mix of flash and pro)"*; Vertex *"Higher rate limits with billing account"* with no number. **Google AI Pro/Ultra and Code Assist per-tier CLI quotas: UNVERIFIED** — the README defers to a quota page and the canonical quota URL 301s to `docs.cloud.google.com/gemini/docs/quotas`, which I had no call left to fetch.

**Gemini API** — <https://ai.google.dev/gemini-api/docs/pricing>, accessed 2026-09-05, **H**. $/MTok paid, in/out; every row below also has a *"Free of charge"* free tier except 3.1 Pro:

| Model | In | Out | Context cache |
|---|---|---|---|
| 3.8 / 3.7 / 3.6 Flash | 0.75 | 3.75 (through Dec 31, 2026) | 0.075 + $0.50/hr |
| 3.5 Flash | 1.50 | 9.00 | 0.15 + $1.00/hr |
| 3.5 Flash-Lite | 0.30 | 2.50 | none |
| 3.1 Flash-Lite | 0.25 | 1.50 | 0.025 + $1.00/hr |
| **3.1 Pro Preview** | 2.00 | 12.00 (≤200k prompt) | 0.20 + $4.50/hr · **no free tier** |
| 2.5 Pro | 1.25 | 10.00 (≤200k) | 0.125 + $4.50/hr |
| 2.5 Flash / Flash-Lite | 0.30 / 0.10 | 2.50 / 0.40 | 0.03 / 0.01 + $1.00/hr |
| Gemini Embedding 2 | 0.20 text | — | free tier yes |
| Gemini Embedding | 0.15 | — | free tier yes |

## Local models

| Model | Dims / params | Size | Licence | Source (accessed 2026-09-05) |
|---|---|---|---|---|
| `sentence-transformers/all-MiniLM-L6-v2` | **384 dims**, 22.7M params | 22.7M params, safetensors | **Apache 2.0** | <https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2> |
| `Qwen/Qwen3-0.6B` | 0.6B params (0.44B non-embedding), 28 layers | BF16 tensors | **Apache 2.0** | <https://huggingface.co/Qwen/Qwen3-0.6B> |

MiniLM quote: *"384 dimensional dense vector space"*; *"input text longer than 256 word pieces is truncated"* — a 256-word-piece ceiling, which matters for chunking transcripts. Qwen3-0.6B: *"32,768"* context. Both **H**. On-disk byte sizes were not stated as a figure on either page — the plan's *"under 100 MB"* for the embedder is consistent with 22.7M params at 4 bytes but is **not quoted from the page**.

## Cost-per-task evidence across CLIs

1. **No vendor-published cost-per-task column was found for any of the three CLIs.** SWE-bench, Terminal-Bench and vendor posts were not reached with a call to spare. Everything below is third-party, **confidence L**, and must not be used as a vendor figure.
2. Third-party, via search 2026-09-05: *"Approximate cost per successful fix on SWE-Bench-scale tasks includes: Opus 4.7 $1.71, GPT-5.3-Codex $1.06, Gemini 3.1 Pro $0.93, Qwen3.6 Plus $0.25, DeepSeek V4 $0.23."* Source: morphllm.com. Not vendor, not reproducible from the page's own method.
3. Third-party: *"Dividing output price by Scale SEAL SWE-bench Pro score shows Claude Haiku 4.5 about $0.13 of output per point, gpt-5.4 $0.25, Gemini 3.1 Pro $0.26, Claude Opus 4.6 $0.48."*
4. Third-party: *"Claude Fable 5.1 takes #1 at 81.2%"* on SWE-bench Pro, dated 2026-09-03.
5. The one **vendor** per-task-ish anchor that exists is Anthropic's, and it is per *developer-day*, not per task: $13/active day, $150–250/month, <$30/day for 90% of users.
