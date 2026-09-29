# Panel 7c — Finance, legal and admin operator (sonnet, read-only)

## 1. Keep from S1.1
- **CAP-40: no transacting before principal/signatory/registration exists** — "the software can prepare before revenue but cannot defer a prerequisite required before the first payment." A hard gate before the first payment.
- **IC-PAY = Stripe (Checkout, Refunds, BalanceTransactions); IC-BOOKS = original bank statements (camt.053/CSV) + hledger 1.52** (`07-integrations-capacity.md` §3). What a fractional CFO would pick: a real processor and a plain-text auditable ledger. Manual bank transfer is the correct fallback.
- **CAP-18 provisional_hypothesis vs demand_supported price.** A test price is never silently promoted to validated demand.
- **ProfessionalRequest + "preparing the packet does not complete the professional work"** (CAP-20/21). Agents package facts and a named provider; a licensed human renders the determination.
- **CAP-42 funded remedy** — "authorised" only when a Reservation is actually held.
- **CAP-39/41 closure substance**: `closed-with-residuals` needs a real custodian, funding and review date. Drop the ceremony.
- **Money-movement rule**: money moves only via an admitted adapter or a specifically authorised human, with a bounded instruction and independent settlement evidence.

## 2. Cut or defer
- **The C01–C09 / ResponsibilityAssignment / Reservation / EvidenceJudgment apparatus as the vehicle for a tiny shop's books.** Trigger: first employee/contractor, first outside investor, or >1 venture concurrently holding customer funds.
- **CAP-24 make/buy procurement for every subscription.** Trigger: >$500/mo discretionary tool spend or >10 active subscriptions.
- **CAP-26 hiring machinery.** Trigger: first hire/contractor.
- **Multi-jurisdiction tax-nexus modelling.** Trigger: an actual nexus threshold crossed.
- **CAP-41 six-condition continuity promotion logic.** Trigger: someone else depends operationally on the business, or reserved customer funds exceed a set floor.
- **Formal insurance arrangement.** Trigger: first paying customer with meaningful liability exposure.

## 3. Add
- **Portfolio shared-cost ledger**: one hledger file with per-venture account tags; agent proposes a monthly split of shared AI/tool subscriptions; founder approves.
- **Runway per venture**: cash observed, burn, weeks to zero.
- **A standing money-move approval queue**: any payment/refund/transfer above a threshold queues for one-tap founder approval.
- **One reusable legal-doc baseline** (ToS / Privacy / DPA), versioned once, agent-filled per venture, flagged "not lawyer-reviewed" until the founder logs a real review.
- **A monthly subscription "kill list"** of unused or duplicate tools, including AI subscriptions.
- **A visible "agents never do this" list** for money/legal in the architecture doc: no signing, no bank-account opening, no tax-return signature, no entity formation, no wire/ACH beyond pre-approved recurring vendors, no contract with a new counterparty.

## 4. ADOPT / ADAPT / LEARN / BUILD
| Area | Decision | Tool | Reason |
|---|---|---|---|
| Payments/invoicing | ADOPT | Stripe (Checkout, Invoicing, Billing) | S1.1's IC-PAY; free until you transact |
| Bookkeeping | ADOPT | hledger 1.52, bank CSV/OFX/camt.053 import | Free, diffable, agent-writable |
| Human-friendly ledger view | LEARN | Firefly III / Actual Budget design ideas | hledger stays source of truth |
| Cross-venture cost split | BUILD | Thin report over hledger tags | No tool does one owner, N ventures, shared AI subscriptions |
| Entity formation | ADOPT (process) | Direct state filing + registered agent, or accountant route | Needs human signatory |
| Contracts / ToS / Privacy | ADAPT | Common Paper-style contracts; TermsFeed/GetTerms-style ToS/Privacy as agent-fillable drafts | Still needs one-time lawyer review |
| Tax | ADOPT (human) | Named CPA/EA via the ProfessionalRequest pattern | Licensed signature required |
| Pricing | ADOPT | `.claude/playbooks/price-a-product.yml` | Already encodes CAP-18 |

## 5. Top 3 risks
1. **Formal-authority machinery on by default for a pre-revenue venture** — ceremony instead of building. Gate it behind triggers.
2. **A reviewer PASS mistaken for legal sign-off.** No engine has legal competence and there is no `legal` review lens. Any external legal doc needs a `founder-approval` gate plus a dated "professional reviewed: yes/no" field.
3. **Commingled or unreserved money across ventures.** Per-venture ledger separation and "funded before promised" are day-one rules, not deferred items.

## 6. Founder-only questions
1. **Q-007:** one umbrella entity for all ventures, or one per venture?
2. **Q-008:** which named accountant and lawyer, and what fee ceiling can agents invoke them under?
3. One shared bank/Stripe account with per-venture tags, or separate accounts per venture?
4. Single-payment/refund threshold that needs your approval, and a monthly aggregate agents may move unattended?
5. Shared subscriptions (including Claude Code/Codex): allocate pro rata into venture runway, or treat as founder overhead?
