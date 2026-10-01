# Provider Contract Registry v0 — README (B0-02)

`registry.yml`: 5 rows — Claude Max 20x × {opus-5, sonnet-5, haiku-4-5, fable-5} + ChatGPT Pro × gpt-6-astra.
Fetched 2026-10-01 from official vendor pages. Every `headless_allowed` value and every quote `text` is a
quoted YAML string (no bare `yes`/`no`), so no parser reads one as a boolean.

**Hashes are machine-computed and machine-checked, not hand-typed.** Each quote's `text` is a single-line,
double-quoted, JSON-compatible scalar; `sha256` is `node:crypto` over that exact string. Run
`node build/providers/verify-hashes.mjs` to re-derive every hash from the committed file and fail (exit 1)
on any mismatch — it caught a real bug this round (a transcription slip had dropped one hex character and
reused one hash across two different quotes) and is mutation-tested against a corrupted hash and a
malformed file before being committed.

**Fetch method gap.** `curl` to external hosts is blocked here, so quotes came via `WebFetch`, an
LLM-rendering proxy, not raw HTTP. Every quote in `registry.yml` was confirmed with a second, targeted
"does this exact sentence appear" fetch; hashes are proof against that rendering, not raw HTML.

**GAP: OpenAI's Terms of Use was not fetched.** `openai.com/policies/terms-of-use` and `row-terms-of-use`
— the OpenAI analog to Anthropic's Consumer Terms automated-access clause — returned HTTP 403 to every
WebFetch attempt this session (bot-blocking). The `gpt-6-astra` row's `headless_allowed: "yes-conditional"`
rests on product docs (learn.chatgpt.com, developers.openai.com) only; it does not clear the account-level
Terms of Use. Follow-up: fetch via a browser-capable path.

**Numeric-cap gaps — B0-00 fills these by measurement (DR-61).** No official page states an absolute
5-hour/weekly number for Claude Max 20x or ChatGPT Pro's weekly cap. One clean exception: ChatGPT Pro's
5-hour window is explicitly "none currently applied."

**`launches.csv` seat/window columns are B0-20's, not this job's.** Per the orchestrator: B0-20 owns
`launches.csv`; this registry supplies the per-(plan,model) facts it should read, once B0-00's measured
caps exist to populate them. Deferred, not skipped.
