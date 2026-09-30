# 03 — Components

**M1** = month one. Otherwise the trigger that brings it in. Licences as reported by panel 3 and the red team; those marked † were not quote-verified and are re-checked by the intake job before adoption. Cost is $0 unless stated.

## Core system
| Component | Verdict | Tool + licence | When | Reason |
|---|---|---|---|---|
| Model execution (build) | ADOPT | Claude Code CLI `claude -p --agent` (subscription) | M1 | The founder's subscription; runs the harness natively |
| Model execution (review) | ADOPT | Codex CLI `codex exec -s read-only` (subscription) | M1 | Second model family without an API key |
| Engines, lenses, playbooks, skills, gates, ledger, sandbox | ADAPT | This repo | M1 | NN6. Add envelope fields, `venture_id`, ledger `supersedes`/`valid_from` |
| Job runner + queue | ADAPT (BUILD parts) | `mission-control/scripts/consume-dispatch.ts` + SQLite (public domain) | M1 | BUILD reason: no tool does schema-checked returns, runner-computed status and subscription-window budgeting against two CLIs. Extend the shipped consumer, not a new project |
| Scheduler | ADOPT | launchd (macOS) | M1 | Keeps subscription credentials off CI; always-on Mac |
| Usage metering | ADOPT | ccusage (MIT) | M1 | Reads local logs for the window estimate |
| Codex PTY wrapper | BUILD (small) | `script`/node-pty (MIT) around `codex exec` | M1 | Codex bug #19945: empty stdout when detached from a TTY. Nothing packages the workaround |
| Preflight harness token | BUILD (small) | SessionStart/PreToolUse hook | M1 | Proves the harness loaded in the worker; project-specific |
| Context-pack loader | BUILD | Node script in harness | M1 | Must bind to this ledger and venture layout (AD-017) |
| Search | ADOPT | SQLite FTS5 + ripgrep | M1 | Flat retrieval beat graph in L05; no server |
| Outcome log, `/correct` | BUILD (small) | JSONL + command | M1 | Only input to improvement; attaches to the ledger |
| Canonical memory | ADAPT | Claim ledger + `evict-memory.mjs` + markdown | M1 | Already enforces expiry, provenance, no false pass |
| Version control, board | ADOPT | git + GitHub (+ Projects) | M1 | Existing |
| Browser automation | ADOPT | Playwright MCP (Apache-2.0) | M1 | Already granted to `designer`; covers browser-use/Stagehand |
| Secrets | ADOPT | 1Password CLI + per-venture env file | M1 | One secrets tool; never in a worker environment |
| Push alerts | ADOPT | ntfy (Apache-2.0/GPL-2.0, hosted or self) | M1 | Solved; no mobile app to build |
| Founder view | ADAPT | Mission Control (read-only) | M1 | Already local, read-only, SSE; add runner-DB and inbox collectors |
| Monday page, harness-ratio, portfolio view | BUILD (small) | Node script → markdown/artifact | M1 | No tool reads per-venture kill lines across repos |
| Approval inbox (DecisionPacket) | BUILD (small) | `runner inbox/approve` CLI + `.claude/gates.yml` human gates | M1 | Must bind to existing gates and venture scope |
| Models map | BUILD (tiny) | `models.yml` | M1 | One file; a retired model id once broke a blocking lint |
| Harness distribution | ADAPT | existing fleet install → Claude Code plugin marketplace | after fleet census (J11) | Reconciles 16 stale `.claude/` copies |
| Eval runner | ADOPT | promptfoo (MIT) | improvement-loop trigger | Exec providers call `claude -p`/`codex exec` |
| Prompt optimiser | ADAPT | GEPA (MIT) | ≥20 labelled cases per skill | Needs labels and a rollout budget |
| Tracing UI | ADOPT | Langfuse (MIT core) | outcome log >10k rows | Not needed before volume |
| Durable workflows | LEARN → ADOPT | Temporal (MIT) / DBOS (Apache-2.0) | first workflow waiting days on an approval, or billing | Git + SQLite suffice now |
| Graph / vector memory | LEARN → ADOPT | Graphiti (Apache-2.0), sqlite-vec | FTS <85% on a venture's golden set, or >2k docs | Flat first |
| Memory services | LEARN | Mem0, Letta (Apache-2.0) | — | Take Letta's sleep-time consolidation as the weekly job; Mem0 extraction needs an API key |
| Orchestration frameworks | LEARN | LangGraph, CrewAI†, smolagents, AG2, OpenHands | — | Expect metered API keys (NN2); personas add tokens, not capability |
| Parallel-lane UIs | CUT | Claude Squad, Vibe Kanban, Conductor | — | Mission Control covers it |

## Venture tools
| Component | Verdict | Tool + licence | When | Reason |
|---|---|---|---|---|
| Venture template | BUILD (tiny) | `/new-venture` + `venture.yml`/`project.yml` schema | M1 | Scaffolds repo, ledger, USER-INSIGHTS, env file |
| Discovery workflow | ADAPT | `validate-a-market` playbook + `talk` stage + evidence ladder | M1 | Only wiring missing |
| Mom Test scorer | BUILD (small) | Entry in `review-lenses.yml` | M1 | Nothing open-source scores discovery transcripts |
| Transcription | ADOPT | whisper.cpp (MIT), local | M1 | No personal data leaves the Mac |
| Scheduling calls | ADOPT | Cal.com free tier (AGPL, hosted) | M1 | No build |
| Landing pages | ADAPT | `launch-landing-page` playbook + Vercel | M1 | Already gated by `outbound-approval` |
| Analytics, flags, experiments, surveys | ADOPT | PostHog Cloud (MIT core, free tier) | M1 | One tool replaces Plausible, Umami, GrowthBook, Segment, Tally |
| Email (waitlist, outbound, lifecycle) | ADOPT | Resend (free tier) | M1 | Stack default; replaces Listmonk |
| Pre-sales | ADOPT | Stripe Payment Links | M1 | Money in only; refunds need approval |
| Contacts | ADOPT | CSV in the venture repo | M1 | Twenty CRM at >100 contacts |
| Outbound batch | BUILD (thin) | New stage on `outbound-approval` + Resend | M1 | Real gap, small |
| SEO / GEO | ADAPT | `seo-content-writer` skill + llms.txt; `seo-*` agents in `~/.claude` vetted first | first content cadence | Panel 6's four `seo-*` skills do not exist in this repo |
| CRO experiments | ADAPT | `page-cro`, `form-cro`, `onboarding-cro` skills + CAP-29 predeclaration | Solution-validated stage | Wiring only |
| Social scheduling | ADOPT | Typefully/Buffer free, or n8n | content cadence ≥2 posts/week | Don't build a scheduler |
| Support helpdesk | ADOPT | Chatwoot (MIT†, hosted) | first paying customer | Before that, email to the founder |
| Status page | ADOPT | Upptime (MIT) | first paying customer | Zero-cost deflection |
| Docs site | ADOPT | Docusaurus (MIT) | first paying customer | Builder writes, reviewer checks voice |
| Bookkeeping | ADOPT | hledger (GPL-3.0) + bank CSV | first payment | Plain text, per-venture tags |
| Cost split, runway | BUILD (thin) | Report over hledger tags | first payment | No tool splits one owner's shared AI subscriptions over N ventures |
| Legal drafts | ADAPT | Common Paper / TermsFeed-style templates, flagged "not lawyer-reviewed" | first external user | A lawyer reviews once |
| Tax, entity | ADOPT (human) | Named accountant | first invoice or payment | Licensed signature required |
| Auth, DB for venture products | ADOPT | Clerk / Supabase (Pro with PITR at first customer) | per venture | Stack default |
| GitHub, Stripe, Supabase, Gmail MCPs | ADOPT | Official servers | each at its first need, after a vetting job | One grant per engine |
| Egress allowlist | ADAPT | tinyproxy/mitmproxy ACL | first autonomous spend or agent touching customer data | Far cheaper than per-job WireGuard |
| Chat front door | ADOPT | Telegram/Slack bot | a second person needs access, after three-flag rule ships | Injection path |

**Count in month one: 16 tools** (Claude Code, Codex, SQLite, ccusage, launchd, git/GitHub, Playwright MCP, 1Password, ntfy, Mission Control, whisper.cpp, Cal.com, Vercel, PostHog, Resend, Stripe Payment Links) — the red team's list plus Cal.com and Mission Control, which already exists; promptfoo waits for its trigger. **Nothing self-hosted on the Mac besides SQLite and whisper.cpp.**
