# Panel 7b — Customer, support and operations operator (sonnet, read-only)

## 1. Keep from S1.1
- **Grievance independence (AD-006; C07; CAP-42).** A complaint about the agent/person handling a customer routes to a recipient outside that decision/incentive loop (`disputed_custodian` guard). Small-team form: the founder, not the support agent that caused the problem, is always reachable. The most trust-critical idea in the spec; costs nothing.
- **Funded-before-authorised remedy** (`remedy_authorized`: authorisation without reserved funding "is an unowned promise"). Never let an agent say "we'll refund/fix that" without the money or fix actually queued.
- **Refund tied to entitlement, never paid twice** (AD-013). Fulfilment completion is an observed fact, not "payment settled". Stripe's own objects are ground truth.
- **CAP-30 onboarding = verified usability**, not account creation; failure creates a support/remedy duty with an update deadline.
- **CAP-16: sensitive exchanges route to a real person; "a bot signature cannot impersonate that involvement."** Keep as a disclosure rule.
- **Continuity duties survive pause/closure** (CAP-36/39/41). A sunset product still owes refunds/support.
- **The `customer` lens in `.claude/lenses.yml`**: quantify signal → classify root cause → route to most upstream fix → capture verbatim language. Right and underused.

## 2. Cut or defer
- **Full 10-phase `GrievanceCase` state machine.** Trigger: first grievance the founder can't close in a day, or first refund dispute/chargeback.
- **Formal `ContinuityArrangement`** (six structural conjuncts). Trigger: first contractor/employee with support access, or first contractual SLA.
- **Nine-component delivery-capacity verification before every sale.** Trigger: a venture with real scarce capacity where an informal tracker already caused an overcommit.
- **CAP-22 full privacy formalism.** Keep a minimal data map + deletion capability; build the rest at first regulated-data customer or first DSAR.
- **Multi-domain coordinating case.** Trigger: second concurrent venture where one defect spans product + billing + supplier.

## 3. Add — the everyday support loop S1.1 never specified
1. **Support-triage engine loop:** read inbox → classify (bug / billing / feedback / churn signal / other) with the `customer` lens → draft reply → auto-send if high-confidence and low-stakes, else hold for the founder with a one-line reason.
2. **Autonomous-vs-escalate matrix.** Agent may resolve FAQs, known bugs, refunds under $X within Y days; must escalate chargeback/legal threats, refunds above $X, or the same bug from ≥2 customers (a product-gap signal).
3. **Customer voice → build loop, concretely.** Every ticket tagged; weekly digest of top verbatim pain quotes with frequency; a bug from ≥2 customers auto-opens a `framer` item citing ticket IDs; feeds `USER-INSIGHTS.md`.
4. **Churn/dormancy signal:** "was active, now silent N days" → check-in/win-back playbook.
5. **Lightweight fulfilment tracker for non-software service work:** one row per engagement — milestone, evidence, next date, owner.
6. **Public status/changelog** to deflect repeat inbound.
7. **Mandatory AI disclosure + human escape hatch on every AI-authored support reply.**

## 4. ADOPT / ADAPT / LEARN / BUILD
| Component | Decision | Tool | Why |
|---|---|---|---|
| Support inbox/helpdesk | ADOPT | Chatwoot (OSS, self-hostable, API + webhooks) | Real ticket state + agent read/write API |
| Knowledge base | ADOPT | Markdown docs site (Mintlify/Docusaurus) in-repo | `builder` writes, `reviewer` checks voice |
| Ticket classification | ADAPT | Existing `customer` lens + `framer` dispatch | BUILD only webhook→dispatch glue |
| Refund/entitlement truth | ADOPT | Stripe refund/dispute objects | Matches AD-013 |
| Churn/dormancy detection | ADOPT + BUILD glue | Segment CDP (in stack) or product analytics + scheduled query | Label every signal with source/date |
| Escalation log | LEARN + ADAPT | CAP-42 phase vocabulary in DECISIONS-style entries | Keep authorised ≠ performed ≠ disposed; drop the schema |
| CSAT survey | ADOPT | Tally or Typeform free tier | No build |
| Status page | ADOPT | Upptime (OSS, GitHub Actions) | Zero-cost deflection |

## 5. Top 3 risks
1. **AI support erodes trust or creates liability** (answering as human, over-promising, missing a chargeback/legal threat). Mitigation: disclosure + escape hatch on every reply, hard-coded escalation triggers, no refund authority above a named threshold.
2. **Customer signal never reaches the build loop.** Mitigation: weekly digest + repeat-bug trigger (§3.3).
3. **Single point of failure + double-paid remedies.** Unreachable founder + active grievance has nowhere to go; without entitlement discipline a refund is paid from support and again from billing.

## 6. Founder-only questions
1. Which support events page you immediately vs batch daily/weekly, across all ventures?
2. Autonomous refund/credit threshold: one number everywhere or per venture?
3. When unreachable >48h, may anyone else (co-founder, VA, contractor) see the inbox and issue remedies?
4. Do non-startup projects (research, content, client work) get the same grievance/continuity discipline or a lighter version — and which projects have paying customers today?
5. Public status/changelog from day one, or after product-market fit?
