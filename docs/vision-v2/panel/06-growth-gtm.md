# Panel 6 — Growth and GTM operator (sonnet, read-only)

## 1. Keep from S1.1
- **`growth` lens procedure** (`.claude/lenses.yml`): read captured customer language before drafting, block rather than invent when none exists, reuse verbatim phrasing, name surface/audience/goal, check voice rules, stage — never direct-publish. Already encoded and enforced; keep as v2's GTM spine.
- **`launch-landing-page` playbook**: positioning → copy → design → ship, with `claim(kind=user-language, verified_by=source)` at entry and `gate: outbound-approval` (a `kind: human` gate) before production. Agents own drafting end to end; the founder owns the one irreversible step.
- **CAP-09 Brand/identity**: stable identity/voice separated from tone adapted to first contact, relationship, failure, apology; owner taste final. Keep as a lightweight voice file.
- **CAP-13 content claims/rights/disclosure discipline; CAP-28/29 predeclared hypothesis, stop rule, retained failures** — keep the discipline, map onto the claim ledger, not new record types.
- **CAP-16 and the DIRECTIVE boundary**: sensitive negotiation routes to a real person; contacting customers or strangers requires authorisation. The hard line for outbound and community.

## 2. Cut or defer
- **CAP-14 channel-authorisation bureaucracy** (recipients, contact allocations, suppression lists as record types). Trigger: first campaign >~200 contacts, or first spam/opt-out complaint.
- **CAP-15 sales negotiation/signatory machinery.** Trigger: first negotiated deal, or first co-founder/employee with pricing authority.
- **CAP-28 warehouse-grade analytics.** Trigger: >100 signups/month or first pricing decision made from funnel data.
- **Segment CDP as the growth default.** Trigger: a second analytics/marketing tool needing the same event stream.

## 3. Add
- **SEO and AI-search (GEO) visibility has no home.** CAP-14 never names organic search, llms.txt, schema markup or AI-answer citability. The repo has `seo-geo` and `seo-content-writer` but neither is wired into the growth lens or a playbook.
- **A content cadence engine** — a repeatable calendar sharing one founder voice across several ventures.
- **An outbound capability**: "founder approves list + template once, agent personalises and sends the batch", using the existing `outbound-approval` gate. The most common zero-to-1,000 lever.
- **Community/organic distribution** (Reddit, HN, LinkedIn, X) — how most lean first customers arrive.
- **A CRO experiment loop** — `page-cro`, `form-cro`, `onboarding-cro` skills exist, used by no playbook.
- **Portfolio-level GTM memory** — know when venture B's audience overlaps venture A's without leaking A's claims into B's copy.

## 4. ADOPT / ADAPT / LEARN / BUILD
| Component | Type | Tool | Reason |
|---|---|---|---|
| Landing pages / launches | ADOPT | `launch-landing-page` playbook, `builder` + `designer`, Vercel | Already gated; extend the lens |
| Technical SEO / schema / sitemaps | ADOPT | existing `seo-technical`, `seo-schema`, `seo-sitemap` as builder-called workers | Procedure already in repo |
| AI-search (GEO) | ADOPT | existing `seo-geo` + llms.txt | Zero cost |
| Analytics/funnels | ADOPT | PostHog over Segment | One tool for funnels, replay, flags at this scale |
| Email lifecycle | ADOPT | Resend (stack default) | No new ESP until list size demands |
| Social scheduling | ADOPT | Typefully/Buffer free tier, or n8n via the existing n8n MCP | Don't build a scheduler |
| Outbound batch | BUILD (thin) | new playbook stage on `outbound-approval` + Resend/Gmail MCP | Genuine gap; small |
| CRO experiments | ADAPT | wire CRO skills into a `run-cro-experiment` stage with CAP-29 predeclaration | Only wiring missing |
| Competitive/market research | ADOPT | `sourcer` + `competitive-landscape` / `market-sizing-analysis` skills | Already correct |
| Cross-venture GTM memory | ADAPT | venture-scoped `USER-INSIGHTS.md` / ledger tags | Reuse, no new CRM |

## 5. Top 3 risks
1. **The outbound/publish gate is declared but never exercised end to end** — the same "gate exists, never fired" pattern the QA gate had.
2. **Cross-venture bleed.** `requires_claims: [user-language]` is not venture-scoped; venture A's phrasing or pricing claim could be cited for venture B.
3. **AI GTM content becoming slop at scale.** The lens's banned-word list isn't linted; confirm `review(lens=voice)` has real teeth.

## 6. Founder-only questions
1. GTM memory (customer language, positioning, voice) siloed per venture by default, or shared unless flagged?
2. Outbound: approve list + template once and let the agent send the batch, or look at every send?
3. Which analytics accounts do you already hold (PostHog, GA4, Segment, none)?
4. One shared visual/voice system across ventures, or independent identity per venture?
5. The largest GTM action you'd let run unattended, versus what always needs you even after trust is earned?
