# L10 — Economics, subscription capacity, execution rights, and infrastructure

Research date: **2026-09-12**. Independent expansion, not architecture selection. Inputs read: [vision and fields](../inputs/THE-VISION-AND-THE-FIELDS.md), [directive contract](../inputs/directive-contract.json), required engine instructions, and OpenAI Docs skill. No other lane or existing plan informed this report.

## Finding: four scarce resources, four different accounts

**Founder constraint:** internal work primarily uses authorized subscription coding environments, approximately **USD 200/month Claude Code + USD 200/month Codex**. This is a USD 400 planning baseline, not a verified invoice, purchasing authorization, token balance, guaranteed throughput, or customer-product entitlement. Additional spending and silent metered fallback remain unauthorized.

**Inference:** economic viability requires separate records for money, provider allowance, execution capacity, and owner attention. A subscription can remain paid while exhausted; a machine can have idle CPUs while inference is unavailable; completed work can accumulate beyond anyone’s ability to accept responsibility. The vision’s useful unit is a defensible attempt reaching a customer, including the cost of stopping failures, rather than generated output.

## Provider findings and execution rights

The following are **source claims**, except where explicitly marked interpretation. Source IDs resolve to dated primary-source records below.

| Surface | Verified distinction | Consequence for this project |
|---|---|---|
| Claude individual subscription | Max 20x is advertised at USD 200/month for web subscriptions; five-hour sessions and an account-assigned weekly reset apply. Other caps remain discretionary. [A1] | The founder assumption matches an advertised tier, but tax, billing channel, actual tier and allowance remain account facts. |
| Claude CLI and SDK | Current support guidance says Agent SDK and `claude -p` continue consuming subscription limits. The announced separate monthly SDK credit was paused and is unavailable. [A2] | Do not implement the obsolete credit pool or declare scripted use categorically API-only. |
| Claude scripted authentication | `--bare` skips subscription credentials and needs an API key/helper for Anthropic access. An environment API key can override subscription authentication. [A3], [A4] | A startup optimization or inherited environment can change the billing path. Validate the effective route before work starts. |
| Claude customer applications | SDK guidance rejects offering subscription login/rate limits without prior approval. Legal documentation separately permits hosting the unmodified Claude Code binary under specified commercial conditions, with each end user authenticating and paying directly. Credential collection, intermediation and resale remain restricted. [A5], [A6] | A hosted coding environment and a service powered by the founder’s subscription are materially different propositions. Neither is selected or authorized here. |
| Codex individual subscription | Pricing identifies Pro 20x at USD 200/month. ChatGPT sign-in uses subscription access; API-key sign-in uses separately billed Platform access. Cloud requires ChatGPT sign-in. [O1], [O6] | Authentication is an economic and data-policy boundary, not merely login UX. |
| Codex unattended work | `codex exec` reuses saved authentication. Documentation describes an advanced ChatGPT-account CI route for trusted environments and specifically excludes public/open-source repositories from that workflow. API keys are the documented default for automation. [O2] | Authorized individual automation is a supported possibility; unrestricted public runners are not justified by a working command. |
| Codex SDK and scheduled work | SDK supports starting, continuing and resuming local threads. Native scheduled tasks run unattended; local projects require the computer on and desktop app running. [O3], [O4] | Native scheduling, CLI execution and a continuously available service have different operational contracts. |
| Codex automation identities | Dedicated access-token documentation lists Business and Enterprise; authentication overview mentions Enterprise. Neither establishes availability on the assumed individual Pro plan. [O1], [O5] | Preserve this documentation discrepancy; do not assume a personal subscription includes service identities. |

**Provider-terms interpretation, not a legal determination:** both consumer terms restrict credential sharing; Anthropic restricts automated access except API access or explicitly permitted cases. OpenAI’s general extraction restriction must be read alongside its documented Codex automation surfaces. These sources support using native, documented paths within their conditions, not circumventing restrictions, rotating identities to evade limits, or turning one person’s login into pooled service capacity. Which agreement and jurisdiction govern the actual account remains unverified. Customer-facing or shared deployment needs a fresh rights analysis against its concrete identity and execution design. [T1], [T2]

**Direct observation:** `codex --version` returned `codex-cli 0.154.0`; `claude --version` returned `2.1.269`. Help exposes noninteractive execution and resume in both. Sanitized `codex login status` reported ChatGPT; sanitized `claude auth status --json` reported logged in, `claude.ai`, first-party, `max`. Commands exited zero. Identity fields were suppressed; no credential files were opened, tokens printed, prompts submitted, limits consumed by a test, or account settings changed. Status does not establish remaining quota, credit settings, or Max 20x versus Max 5x.

## Capacity cannot be inferred from subscription dollars

Claude product surfaces share usage limits, whose consumption depends on context, model, effort and features. Length limits are a different constraint. Codex local and cloud work share plan allowance; five-hour estimates are expressly nonbinding and weekly limits may apply. Model, reasoning, tool use, retrieval, caching and modality affect consumption. Codex says an active turn can continue after exhaustion, subject to fair use; that is not a recovery guarantee. [A7], [O6]

No universal account-level concurrent-worker entitlement was established in the inspected documentation. Parallel process support proves neither unlimited concurrency nor independent quota per worker. The safe **inference** is to observe pressure and bound local parallelism independently of provider limits.

**Design proposal:** represent allowance by provider/account, observed bucket, used fraction, reset timestamp, observation time and confidence. Unknown must remain unknown. Codex documents `account/rateLimits/read` and update notifications, including multiple buckets and optional fields; example window durations are examples, not plan promises. Claude’s usage UI exposes session and weekly information. [O7], [A1] Do not scrape undocumented credential-bearing endpoints to fill missing telemetry.

Measure accepted work, retries, review effort, time waiting, context rebuilding, interrupted work and owner decisions by workload class. Compare ordinary development, research, independent review, operational checks and urgent recovery. A representative observation period can reveal this founder’s operating envelope; it cannot produce a durable “tasks per subscription” conversion.

## Money policy and fallback

Claude usage credits are separately charged, support monthly caps and optional automatic reload. Codex sells additional credits and explicitly offers API-key continuation after included limits. Available prepaid credits can therefore create a spending path even without switching providers. [A8], [O6]

**Design proposal under the existing constraint:** zero newly authorized variable spend. A work request may use a previously authorized subscription route; it may not enable credits, reload balances, upgrade plans, insert API keys, or purchase infrastructure. Already enabled provider billing settings are an **unknown**, not proof of authorization.

Future spend grants should name payer, service, workload, maximum amount, period, expiry, approval identity and stopping behavior. Reserve concurrent commitments before issuing calls; delayed invoices and alerts cannot enforce a hard cap. Record estimates separately from reconciled charges. Subscription allocation may support internal accounting, but API token-price multiplication must never be presented as the subscription bill or remaining allowance.

## Useful mechanisms and rejected shortcuts

These are **candidate mechanisms**, not selected components:

1. A persistent work queue distinguishes `waiting-for-capacity`, `waiting-for-auth`, `waiting-for-owner`, interruption, cancellation and failure. Retry only when the classified cause can have changed; reread allowance at reset and use bounded backoff for transient outages.
2. Before switching, save purpose, constraints, artifact revision, verified results, outstanding effects, next action and authority. A substitute provider must pass task-quality, tool, privacy and permission checks. Switching provider cannot increase spending authority.
3. An execution adapter identifies provider, account owner, workspace, billing mode, supported surface, version, capabilities, observed allowance, interrupt/resume behavior and policy evidence. It returns provenance and uncertainty rather than exposing credentials to orchestration.
4. Preserve capacity for recovery and verification as an explicitly chosen policy. Reduce admissions before lowering required review quality. Deterministic checks, demand-driven research and reusable verified artifacts can reduce inference demand without weakening evidence.

Rejected: endless retries against an exhausted weekly bucket; blanket delegation because more processes are available; a hardcoded monthly token entitlement; invisible API fallback; subscription resale; exporting login secrets into customer jobs; and treating native resume as rollback of external actions. None solves the underlying money, rights or accountability constraint.

## Infrastructure and attention economics

**Design proposal:** cost each candidate architecture with the same worksheet, leaving unknown quantities blank. No infrastructure vendor or deployment topology is chosen.

| Cost family | Count and bound |
|---|---|
| Execution and hosting | Existing-machine depreciation, electricity, connectivity, sleep/outage risk; alternatively persistent-host or burst-runner charges, build minutes and operational labor. |
| Database and storage | Working state, artifacts, attachments, indexes, replicas, retention, reads/writes, migration and egress. R2 illustrates separate storage and operation charges despite free direct egress. [I1] |
| Backup and recovery | Independent copies, credentials, restore environments, exercises, downtime and lost work. Supabase warns that database backups exclude stored objects, illustrating why “backup enabled” is insufficient. [I2] |
| Search | Index construction, updates, query load, licensed sources, external searches, optional embedding/reranking and retrieval evaluation. Compare lexical search before assuming a paid vector service. |
| Observability | Events, trace volume, retention, cardinality, dashboards and alert handling. OpenTelemetry documents minimizing and filtering sensitive telemetry; collection itself creates privacy and security work. [I3] |
| Domains, communication and services | Registration and renewal, mailboxes, transactional sends, messaging, delivery failures, third-party minimums, renewals and cancellation work. |
| Security and continuity | Secret management, MFA recovery, dependency maintenance, isolated runners, access reviews, incident response and restoration of the owner’s ability to operate. |
| Owner attention | Review, decisions, interruptions, customer contact, competence practice, incident recovery and vendor migration. Record minutes and decision complexity, without inventing an hourly value. |

**Inference:** cheap storage can still produce expensive evidence if nobody can find or trust it. Likewise, fewer alerts can conceal more failures. Evaluate total recoverable operation, not the hosting invoice alone. When owner capacity is exhausted, decline or defer new commitments rather than converting informed approval into automatic acquiescence.

## Internal economics versus a future customer product

Internal tooling is overhead justified by faster learning, sounder decisions and cheaper abandonment. A future product needs separate customer revenue and cost records: delivery, licensed inference, infrastructure, support, payments, refunds, abuse, security, privacy obligations, acquisition and wind-down. Track contribution per accepted customer outcome and per cohort; do not divide the founder’s USD 400 baseline by hypothetical customers.

**Hypothesis:** a product selling verified work may command value beyond inference, but this lane provides no willingness-to-pay evidence. Customer promises about latency or availability cannot rest on personal subscription resets. Bring-your-own-provider arrangements shift some billing but retain integration, support and rights costs; they do not establish permission to collect credentials. [A6]

## Failures, disagreements, and questions that remain

The observed stale SDK announcement is a concrete evidence failure: search results retained a planned change after the source’s leading update withdrew it. The record preserves the correction. OpenAI documentation also redirected from Developers to ChatGPT Learn; a guessed `/docs/credits` page returned 404, so credit claims rely on the opened pricing page. Documentation assertions were not workload benchmarks.

Potential operational failures include concurrent exhaustion starving review, a reboot losing uncommitted context, API credentials overriding subscription login, overlapping retries duplicating actions, credit auto-reload breaching authority, and evidence retention exceeding restore capacity. Containment requires explicit checkpoints, effect reconciliation, admission control and enforced billing boundaries. Their effectiveness remains untested here.

**Requires further evidence:** actual invoices/taxes, plan subtype, credit enablement, reset timestamps, provider concurrency behavior, a stable Claude machine-readable allowance interface, recovery under exhaustion and model substitution quality. **Requires founder decision:** owner attention budget, tolerable delay, recovery reserve, acceptable downtime/data loss and any future spend envelope. **Requires external professional when concretized:** material customer embedding/resale, contractual promises and jurisdiction-specific exposure.

Missed questions worth carrying forward: Who can operate when the account owner is incapacitated? Does sharing a device accidentally share authority? Which recurring services survive a project’s shutdown? What is the economic loss when the cheapest available model produces work the owner cannot verify? How much capacity must remain to explain and unwind yesterday’s failure?

## Evidence register and expiration

All URLs below were **opened 2026-09-12**. Dates are publisher dates where visible; “live, undated” means no publication date established. All sources are primary. **P** identifies a provider selling/controlling the service, with incentives toward adoption, retention, upgrades and limiting liability. **N** identifies the OpenTelemetry project, with an adoption incentive. High confidence means confidence in the reported source text, not independent verification of service performance or legal applicability. Findings using multiple sources are corroborated only within those publishers, not independently benchmarked.

| ID / exact source | Source date; type; incentive | Confidence; expiry; invalidation |
|---|---|---|
| [A1 Max plan](https://support.claude.com/en/articles/11049741-what-is-the-max-plan) | 2026-08-07; support/pricing; P | High; 2026-09-19; plan/reset change |
| [A2 SDK pause](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) | 2026-06-16; support correction; P | High; 2026-09-19; replacement announcement |
| [A3 Programmatic CLI](https://code.claude.com/docs/en/headless) | Live, undated; technical; P | High; 2026-09-19; CLI/auth change |
| [A4 API environment](https://support.claude.com/en/articles/12304248-manage-api-key-environment-variables-in-claude-code) | 2026-05-05; support; P | High; 2026-09-19; precedence change |
| [A5 Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview) | Live, undated; technical/rights; P | High; 2026-09-19; SDK/license change |
| [A6 Legal/compliance](https://code.claude.com/docs/en/legal-and-compliance) | Live, undated; provider interpretation; P | High text, conditional applicability; 2026-09-19; deployment/terms change |
| [A7 Usage versus length](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work) | 2026-07-13; support; P | High; 2026-09-19; allowance change |
| [A8 Usage credits](https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans) | 2026-08-10; billing support; P | High; 2026-09-19; billing change |
| [O1 Authentication](https://learn.chatgpt.com/docs/auth) | Live, undated; technical; P | High; 2026-09-19; auth/plan change |
| [O2 Noninteractive mode](https://learn.chatgpt.com/docs/non-interactive-mode) | Live, undated; technical; P | High; 2026-09-19; runner/auth change |
| [O3 Codex SDK](https://learn.chatgpt.com/docs/codex-sdk) | Live, undated; technical; P | High; 2026-09-19; SDK change |
| [O4 Scheduled tasks](https://learn.chatgpt.com/docs/automations) | Live, undated; technical; P | High; 2026-09-19; surface/availability change |
| [O5 Access tokens](https://learn.chatgpt.com/docs/enterprise/access-tokens) | Live, undated; technical; P | High text, medium cross-page consistency; 2026-09-19; eligibility change |
| [O6 Pricing](https://learn.chatgpt.com/docs/pricing) | Live, undated; pricing/support; P | High; 2026-09-19; pricing/allowance change |
| [O7 App Server](https://learn.chatgpt.com/docs/app-server) | Live, undated; protocol documentation; P | High; 2026-09-19; schema/client change |
| [T1 Anthropic consumer terms](https://www.anthropic.com/legal/consumer-terms) | Effective 2025-10-08; contractual text; P | High text, applicability unresolved; 2026-10-12; terms/account/jurisdiction change |
| [T2 OpenAI ROW terms](https://openai.com/policies/row-terms-of-use/) | Effective 2026-01-01; contractual text; P | High text, applicability unresolved; 2026-10-12; terms/account/jurisdiction change |
| [I1 R2 pricing](https://developers.cloudflare.com/r2/pricing/) | 2026-08-07; pricing; P | High; 2026-10-12; storage/billing change |
| [I2 Database backups](https://supabase.com/docs/guides/platform/backups) | Live, undated; technical; P | High; 2026-10-12; backup coverage change |
| [I3 Sensitive telemetry](https://opentelemetry.io/docs/security/handling-sensitive-data/) | Modified 2026-01-14; technical; N | High; 2026-12-12; collector/data change |

Local observations expire on authentication, configuration or CLI change and require rechecking before automation. Proposals remain unselected; economics hypotheses expire when measured operating or customer evidence contradicts them. Provider rights must be revalidated before introducing a new execution surface, even before the calendar expiry.

[A1]: https://support.claude.com/en/articles/11049741-what-is-the-max-plan
[A2]: https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan
[A3]: https://code.claude.com/docs/en/headless
[A4]: https://support.claude.com/en/articles/12304248-manage-api-key-environment-variables-in-claude-code
[A5]: https://code.claude.com/docs/en/agent-sdk/overview
[A6]: https://code.claude.com/docs/en/legal-and-compliance
[A7]: https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
[A8]: https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans
[O1]: https://learn.chatgpt.com/docs/auth
[O2]: https://learn.chatgpt.com/docs/non-interactive-mode
[O3]: https://learn.chatgpt.com/docs/codex-sdk
[O4]: https://learn.chatgpt.com/docs/automations
[O5]: https://learn.chatgpt.com/docs/enterprise/access-tokens
[O6]: https://learn.chatgpt.com/docs/pricing
[O7]: https://learn.chatgpt.com/docs/app-server
[T1]: https://www.anthropic.com/legal/consumer-terms
[T2]: https://openai.com/policies/row-terms-of-use/
[I1]: https://developers.cloudflare.com/r2/pricing/
[I2]: https://supabase.com/docs/guides/platform/backups
[I3]: https://opentelemetry.io/docs/security/handling-sensitive-data/
