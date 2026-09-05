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
