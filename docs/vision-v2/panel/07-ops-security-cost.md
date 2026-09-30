# Panel 7 — Pragmatic ops, security and cost lead (sonnet, read-only)

## 1. Keep from S1.1
- **Consequence-authority separation**: nothing that produces a proposal may authorise its own release; a distinct gate checks authority and prerequisites before anything consequential fires. Right for money/public/legal actions. (`02-authority-recovery.md` §§4–6; S1-C04.)
- **Recovery/continuity as a named responsibility** — "what breaks if I disappear for 30 days". (`02` §12; S1-C08; B07.)
- **Money, tokens, jobs and attention as separately accounted units**, never inferred from each other. (`07-integrations-capacity.md` §6.)
- **Watching for the metered-billing flip** (subscription → pay-as-you-go is "one account setting away and nothing currently observes it"). (`07` §5, AuthAttestation.)
- **Default-deny, narrow-tool CLI invocation** for native subscription runs (`--safe-mode --restricted --tools "" --permission-mode dontAsk`). (`07` §5.)
- **The outside reviewer's conclusion**: a minimum first release using existing humans/tools for the nine logical responsibilities instead of nine deployed services. (F2-07 "Minimum first release"; verdict SCOPED.)

## 2. Cut or defer
- **Dual-AWS-account + independent-region witness Postgres + Keycloak/OIDC/WebAuthn** (02 §2). Defer to first hire/contractor or first paying customer. Until then: Clerk/Supabase Auth + one managed Postgres with PITR.
- **Cryptographic witness ledger / signed DurabilityReceipts** (02 §6.1, §12). Defer to first real payment or first signed contract. Until then: an append-only, git-committed approval log.
- **Per-job WireGuard + nftables egress gateway VM** (02 §7.2; 07 §5). Defer to first autonomous-spend action or first agent touching real customer data. Until then: Claude Code's and Codex's own sandboxes (already armed here).
- **Weekly automated restore + quarterly DR drills with named custodians** (02 §12). Defer to first employee or revenue that would hurt to lose. Until then: a 15-minute monthly founder-run restore smoke test.
- **5-lane capacity-share scheduler** (07 §6, Q-022). Defer to >2–3 concurrent agent lanes in production.
- **Separate N/X machines per job** (07 §5). Keep the principle (build/test workers never hold prod credentials); defer network isolation to the egress-gateway trigger.

## 3. Add
- **A 10-line "always ask a human" list**: spend over $X, contact a real external person, sign anything, destructive prod-data change, billing-tier change, credential rotation nobody requested. A checklist, not a kernel.
- **A named secrets manager now**: 1Password CLI or Doppler + Vercel/Supabase env vars.
- **A subscription/token budget dashboard as a build unit**: turns/session, sessions/day, $/session across Claude Code and Codex, with a **hard stop**, not just an alert.
- **Resolve Q-022 as a task**: read your own Claude/Codex account settings page.
- **A `venture_id` on every budget/capacity record** — cost and turns per venture on one shared subscription.
- **A one-page incident runbook** for this harness's failure modes (leaked secret, subagent force-push, subagent overspend).

## 4. ADOPT / ADAPT / LEARN / BUILD
| Area | Decision | Tool | Reason |
|---|---|---|---|
| Human auth | ADOPT | Clerk / Supabase Auth | Stack default |
| Secrets | ADOPT | 1Password CLI + Vercel/Supabase env vars | No custom key custody |
| DB + backup/PITR | ADOPT | Supabase Pro (daily backup + PITR) | ~$25/mo vs dual-region Postgres + witness |
| Agent sandboxing | ADOPT | Claude Code Seatbelt/bubblewrap (armed) + Codex sandbox | Already built |
| Outbound allowlist (later) | ADAPT | tinyproxy/mitmproxy with an ACL, at trigger | Far cheaper than per-job WireGuard |
| Consequential-action gate | ADAPT | `.claude/gates.yml` + `scripts/check-gates.mjs`; add `kind: human` gates for money/public/legal | Proven with qa-verdict |
| Cost/usage observability | ADOPT | Claude Code/Codex usage pages + small cron script logging to Supabase or a sheet | No formal record schema |
| Audit trail | ADOPT | git + DECISIONS.md + `.qa/verdicts/*.json` | Already exists |
| Incident runbook | BUILD (small) | `docs/RUNBOOK.md` | Project-specific |
| Legal minimum (at trigger) | ADOPT | Termly or similar free-tier generator | Only once external users are touched |

## 5. Top 3 risks
1. **Overbuilding the safety machinery.** Inheriting S1.1's B00–B11 sequence and nine-component authority kernel means months on Keycloak/WireGuard/witness plumbing before any venture ships.
2. **Autonomous agents with money/public/legal capability and no pre-action hard stop.** This repo's gate already caught agents calling dangerous work "finished" (path traversal, 11 SSRF bypasses, an auto-approved RCE path). Every such action must gate before it fires.
3. **Subscription/rate-limit exhaustion or a silent metered-billing flip** across a multi-venture portfolio on one seat each of Claude Code and Codex — the most likely near-term failure.

## 6. Founder-only questions
1. Your actual Claude Code and Codex concurrency/rate limits (Q-022, read the billing page)?
2. The dollar amount on any single autonomous action that needs approval before it happens?
3. A hard daily/weekly token-and-dollar cap (stop and ask) or alerting only?
4. When, if ever, a second person with their own credentials?
5. Does any current work already touch a real customer's personal data or a confidentiality-bound contract? If so, real backups and an incident process move to now.
