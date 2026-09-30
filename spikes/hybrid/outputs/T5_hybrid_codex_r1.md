## COPY

Character counts include spaces and punctuation.

| Label | Copy | Characters |
|---|---|---:|
| H1 | Freelancer Quarterly Taxes | 26/30 |
| H2 | See Your Estimated Tax | 22/30 |
| H3 | Tax Money, Set Aside | 20/30 |
| H4 | Skip the Tax Mental Math | 24/30 |
| H5 | Start Your Free 14-Day Trial | 28/30 |
| D1 | Client paid? Keel moves a calculated share to a tax pot and keeps a running tax estimate. | 89/90 |
| D2 | 14 days free. No card needed. Then $12/mo. Connect via Plaid. Keel doesn't file taxes. | 86/90 |

## TEST PLAN

**Primary metric:** attributed trial starts ÷ ad impressions. Count each new trial once, within seven days of its ad click. This captures both attracting clicks and converting them; CTR alone can reward curiosity without customer acquisition.

**Design:** Randomize eligible traffic 50/50 between the unchanged control and this RSA. Hold targeting, bids, budget constraints, landing page and conversion tracking constant. Test the whole asset bundle; results cannot establish individual headline effects.

Assume 40,000 eligible impressions weekly, stable baseline rates, approximately independent impression outcomes and sufficient budget.

- **Baseline:** \(p_1=0.041\times0.03=0.00123\), or **0.123%**.
- **Pre-chosen MDE:** **40% relative**, or **0.0492 percentage points absolute**; \(p_2=0.001722\), or **0.1722%**.
- **H0:** \(p_{\text{new}}=p_{\text{control}}\).
- **H1:** \(p_{\text{new}}\ne p_{\text{control}}\). Declare a conversion win only for a significant increase.
- **Alpha:** 0.05, two-sided; **power:** 80%.
- \(z_{1-\alpha/2}=1.96\), \(z_{1-\beta}=0.8416\); \(\bar p=0.001476\).

Per-arm sample size:

\[
n=\frac{\left[z_{1-\alpha/2}\sqrt{2\bar p(1-\bar p)}
+z_{1-\beta}\sqrt{p_1(1-p_1)+p_2(1-p_2)}\right]^2}{(p_2-p_1)^2}
\]

\[
=\frac{\left[1.96\sqrt{2(0.001476)(0.998524)}
+0.8416\sqrt{(0.00123)(0.99877)+(0.001722)(0.998278)}\right]^2}
{(0.000492)^2}
=95{,}576.6
\]

**Required:** 95,577 impressions per arm. At 20,000 per arm weekly, \(95{,}577/20{,}000=4.78\) weeks: **five full weeks**, approximately 100,000 impressions per arm.

**Fixed horizon:** Stop enrollment after five weeks; wait seven additional days for attribution to mature. No interim significance checks, early stopping or outcome-driven extensions. Report the effect and 95% confidence interval; nonsignificance does not establish equivalence.

**Feasibility:** A 20% relative lift requires approximately **350,494 impressions per arm—18 weeks**. That is impractical here. The larger 40% MDE makes this a feasible test for substantial gains, with limited ability to detect modest improvements.

**Guardrails:** cost per trial, bank-connection completion per trial and trial-to-paid conversion. Track CTR and click-to-trial conversion diagnostically. Allow downstream cohorts to mature before rollout; sparse guardrail data remain inconclusive.

## RATIONALE

Dominant pains: “not knowing” (Q6, Q7, Q18), money “looking like mine” (Q2, Q3), and maintenance fatigue (Q4, Q10, Q19).

- **H1 — Q6, Q15:** Relevance: names the recurring obligation freelancers struggle to navigate.
- **H2 — Q6, Q7, Q18:** Ambiguity aversion: visibility addresses uncertainty while “estimated” preserves accuracy.
- **H3 — Q2, Q3:** Mental accounting: separates tax money from spendable money.
- **H4 — Q3, Q4, Q10:** Cognitive offloading: replaces repeated mental math and upkeep.
- **H5 — Q19, Q20:** Risk reversal: a free trial lowers commitment after abandoned paid apps.
- **D1 — Q4, Q7, Q17:** Delegation: payment-triggered action and a running estimate address effort and stale numbers.
- **D2 — Q12, Q16, Q20:** Uncertainty reduction: names the connection provider, price and filing boundary beside the offer. Plaid identifies the provider without inventing security assurances.

Offer and feature claims come from the supplied product facts.