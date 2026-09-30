# Provider Contract Registry v0 — README (B0-02)

`registry.yml`: 5 rows — Claude Max 20x × {opus-5, sonnet-5, haiku-4-5, fable-5} + ChatGPT Pro × gpt-6-astra.
Fetched 2026-10-01 from official vendor pages; sha256 covers the quote text stored in the file, not raw HTML.

**Fetch method gap.** `curl` to external hosts is blocked here, so all quotes came via `WebFetch`, which
renders through a small LLM rather than returning raw bytes. One fetch of `learn.chatgpt.com/docs/auth`
produced a sentence a repeat verbatim-dump of the same URL did not reproduce; that sentence is excluded.
Every quote actually in `registry.yml` was confirmed by a second, targeted "does this exact sentence
appear" fetch — but hashes here are proof against this tool's rendering, not against raw HTML. A follow-up
with unblocked HTTP access should re-fetch and re-hash from raw bytes.

**Numeric-cap gaps — B0-00 must fill these by measurement (DR-61).** No official page states an absolute
5-hour or weekly number for Claude Max 20x (only "20x Pro's per-session allowance," unquantified) or for
ChatGPT Pro's weekly cap ("weekly limits may also apply," unquantified). The one clean exception: ChatGPT
Pro's 5-hour window is explicitly "none currently applied." B0-00 fills every `unknown` by running the
fixed benchmark job to throttling on each seat/family and reading weekly headroom off each plan's usage page.

**`headless_allowed` in one line each.** Claude (`unclear`): Consumer Terms bar automated access except via
API key or explicit permission; Claude Code's own page says limits "assume ordinary, individual usage" —
no page flatly permits or forbids the founder's own unattended `claude -p`, matching existing V25/D2.
Codex (`yes`): OpenAI docs name `codex exec`/non-interactive mode as an intended CI use case, including
running CI under a ChatGPT account; the one real restriction is "do not use this workflow for public or
open-source repositories" — scoped to repo visibility, not a headless ban.

**Follow-up, out of scope here:** `launches.csv` seat/window columns — the file doesn't exist yet; wire it
once B0-00's measured caps exist to populate it.
