## COPY

**Headline:** Stop guessing what to set aside for taxes.

**Subhead:** Keel automatically moves a calculated percentage of each client payment into a separate tax pot, keeps your tax estimate updated, and reminds you before quarterly deadlines.

**Primary CTA:** Start my 14-day free trial

**Microcopy:** No card required. Then $12/month or $108/year. Connect your bank via Plaid. Keel doesn’t file taxes.

## TEST PLAN

- **Design:** Randomize unique visitors 50:50, with persistent assignment. Control uses the supplied hero; variant uses the complete COPY above. Keep acquisition, layout, and everything outside the hero unchanged. This tests the hero package.
- **Primary metric:** Unique visitors starting a trial within seven days of assignment ÷ all unique visitors assigned to that arm. Assume the 3.2% baseline uses this definition; verify before launch.
- **Hypotheses:** H0: \(p_V=p_C\). H1: \(p_V\ne p_C\).
- **Pre-chosen MDE:** 20% relative uplift: 3.2% → 3.84%, an absolute increase of **0.64 percentage points**. This is a planning threshold, not a predicted lift.
- **Significance / power:** Two-sided α = 0.05; power = 80%.

**Per-arm sample calculation:**

\[
\bar p=(0.032+0.0384)/2=0.0352
\]

\[
n=
\frac{\left[
1.96\sqrt{2(0.0352)(0.9648)}
+0.8416\sqrt{0.032(0.968)+0.0384(0.9616)}
\right]^2}{(0.0384-0.032)^2}
\]

\[
n\approx\frac{(0.510812+0.219303)^2}{0.00004096}
=13{,}014.4
\Rightarrow \mathbf{13{,}015\ per\ arm}.
\]

- **Fixed horizon:** \(26{,}030/9{,}000=2.89\) weeks; round up to **three enrollment weeks**, yielding approximately 13,500 visitors per arm. Allow seven additional days for outcomes: **four calendar weeks** total. No interim significance checks, early success stops, or extensions based on results.
- **Guardrails:** Bank connections within seven days of assignment ÷ assigned visitors; bank-link failures ÷ connection attempts; bank-trust or filing-confusion support contacts ÷ trial starters. Review operational safety throughout; evaluate comparative outcomes at the fixed horizon.
- **Decision:** Report absolute uplift, relative uplift, and a 95% confidence interval. Ship on statistically significant improvement with acceptable guardrails. An inconclusive result does not establish equivalence.

## RATIONALE

Three recurring pains: “not knowing what the amount is” (Q6, Q7, Q18); money “looking like mine” (Q2, Q3); abandoned manual routines (Q4, Q10, Q19).

- **Headline — Q6, Q7, Q18:** Ambiguity aversion. A visible estimate addresses uncertainty, the stated source of dread.
- **Subhead — Q2–Q4, Q7, Q17:** Mental accounting plus reduced effort. Separating tax money removes the recurring decision to reserve it; updates and reminders support visibility.
- **CTA — Q17, Q20:** Reduced commitment. A bounded free trial lets users assess the automation before paying.
- **Microcopy — Q12, Q16, Q20:** Uncertainty reduction. Disclosing connection method, scope, and price addresses concrete objections at action. Naming Plaid provides information without inventing a security guarantee.

Trial, pricing, and product claims come from the supplied facts. These mechanisms are hypotheses to test.