# v2 outside reviews — synthesis (2026-09-29)

Four independent reviewers (opus, single model family), each researched the web before reading v2.

| Reviewer | Verdict |
|---|---|
| [Coding](01-coding.md) | Build with changes: runner-decides-status is right; launch mechanics will break on the first headless run |
| [Engineering](02-engineering.md) | Control plane sound; no crash/idempotency model; three boundaries a worker's shell can walk around |
| [Founder](03-founder.md) | Well engineered, aimed at the wrong constraint: venture first, harness grows only where the venture hurts |
| [Professional advisor](04-professional-advisor.md) | Guardrails sound; economics and outreach rest on provider terms that forbid or keep changing what the plan does |

## Where all four agree
1. **The runner deciding job status is the best idea in the package.** Keep it.
2. **Start the venture now, in parallel or first.** Customer calls need nothing from the runner. Founder and advisor: before any runner code; coding: M1 clock starts week 1.
3. **Cut the harness `CLAUDE.md` to 8 KB immediately**, as an interactive task, not a queued job.
4. **Shrink and resequence the build.** Defer fleet/plugin, FTS, drift alarms, improvement loop, fake door/outbound jobs until a venture needs them.

## Must-fix findings (not opinions)
| # | Finding | From |
|---|---|---|
| F1 | Resend's Acceptable Use Policy bans cold outreach — the planned outbound channel breaches terms. Use personal 1:1 email from the founder's mailbox; Resend for opt-in/lifecycle only | Advisor |
| F2 | "$0 marginal model cost" is not safe: Anthropic's terms allow automated access only via API key or explicit permission; SDK/`-p` metering was announced and only paused | Advisor, engineering |
| F3 | Consumer plans train by default and give no DPA — turn training off on both accounts; no client/NDA code or identifiable interviewee data through consumer plans | Advisor |
| F4 | Headless launch has no `--permission-mode`/allow list; turn-capped runs return no structured continuation; no timeout or process-group kill; `consume-dispatch.ts` can't be extended into a concurrent runner | Coding |
| F5 | Harness-edit jobs (agents, hooks, settings, commands, `.mcp.json`) can't run headless — do them as interactive founder sessions | Coding |
| F6 | Venture isolation and approval stores are policy, not boundary: workers can `cat` sibling ventures and may write `~/.agentvibe`; done-tests run unsandboxed on LLM-edited code; the three flags are self-declared | Coding, engineering |
| F7 | No crash/idempotency model: leases, reconciler, and an outbox with idempotency keys for any send or charge | Engineering |
| F8 | Codex judging: try `codex exec -o <file>` before building a PTY wrapper; advisor and engineering recommend a small capped OpenAI API key instead | Coding, advisor, engineering |

## Where they differ
- **How much to build before the venture.** Founder/advisor: ~1 week or only what calls prove painful. Coding: 3 weeks resequenced around M1. Engineering: build it, but durable and hardened first.
- **Second model family now or later.** Founder: manual second opinion only, no wrapper. Engineering/advisor: small metered API key now.
