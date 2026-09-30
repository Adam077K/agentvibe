## COPY

**Headline:** Budget for taxes you can see coming.

**Value line:** Keel automatically moves a calculated share of each client payment into a separate tax pot and keeps a running estimate of what you owe.

**Plan name:** Keel Automatic

**Billing toggle:** Annual · Monthly — Annual selected

**Price:** $108/year, billed annually

**Price framing:** Equivalent to $9/month. Save $36/year versus monthly.

**Monthly option:** $12/month

**Benefits:**

- Automatically set aside tax money when clients pay.
- See a running estimate of what you owe.
- Get reminders before quarterly estimated-tax deadlines.

**CTA:** Start my 14-day free trial

**CTA reassurance:** No card required to start. Automatic transfers require a bank connection via Plaid. Keel doesn’t file taxes.

## TEST PLAN

**Design:** Randomize eligible visitors 50/50; persist assignment across return visits. Control defaults to $12/month; variant defaults to $108/year with the framing above. Both offer the same billing toggle. Keep all other copy, layout and acquisition sources identical. This isolates the default billing presentation; it does not test the new copy against existing copy.

**Assumptions:** The 2,400 weekly visits represent distinct eligible visitors, and the 6% baseline applies to their first visits. Deduplicate repeat visits; if eligible traffic is lower, recalculate duration before launch.

**Primary metric:** Visitors starting a trial within seven days of their first eligible pricing-page visit ÷ all randomized eligible visitors. Count each visitor once, regardless of toggle use.

**Hypotheses:** H₀: annual-default and monthly-default trial-start rates are equal. H₁: they differ. Use a two-sided test; a decline remains possible.

**Pre-chosen MDE:** 20% relative lift; **1.2 percentage points absolute**, from 6.0% to 7.2%. α = 0.05; power = 80%.

**Sample size:** With p₁ = 0.060, p₂ = 0.072, p̄ = 0.066, z₁₋α/₂ = 1.960 and z₁₋β = 0.842:

\[
n=\frac{\left[1.960\sqrt{2(0.066)(0.934)}
+0.842\sqrt{(0.060)(0.940)+(0.072)(0.928)}\right]^2}
{(0.072-0.060)^2}
\approx 6{,}721\text{ visitors/arm}.
\]

**Fixed horizon:** 1,200 visitors/arm/week gives 6,721 ÷ 1,200 = 5.60 weeks. Run **six full weeks**, expecting 7,200/arm, then allow seven days for conversions to mature. Analyze once at the end of week seven. No significance peeking, early stopping or outcome-driven extensions.

**Guardrails:** Bank-link completion per trial; trial-to-paid conversion; 60-day net revenue per randomized visitor; cancellation/refund rate among purchasers.

**Decision:** Declare a trial-start win only with a positive effect and two-sided p < 0.05; report the absolute lift and 95% confidence interval. A nonsignificant result is inconclusive. Review mature paid outcomes before permanent rollout: more trials alone cannot establish better economics. This horizon supports the chosen MDE, not reliably smaller effects.

## RATIONALE

- **Headline — Q6, Q18:** Ambiguity aversion; visibility addresses dread about unknown amounts.
- **Value line — Q2–Q4, Q7:** Mental accounting plus effort reduction; separate tax money and refresh stale estimates.
- **Plan name — Q4, Q19:** Effort reduction; “Automatic” answers fatigue with apps requiring attention.
- **Benefit 1 — Q2–Q4:** Mental accounting; earmark money before spending.
- **Benefit 2 — Q6, Q7, Q14:** Ambiguity reduction; make the estimate visible.
- **Benefit 3 — Q1, Q11, Q15:** Prospective-memory support; reminders address missed obligations.
- **Price and toggle — Q20:** Transparent comparison; show the annual commitment and real savings without promising penalty avoidance.
- **CTA and reassurance — Q12, Q16, Q19:** Reduce commitment friction and uncertainty; explain bank access and filing limits at action. Trial terms and prices come from supplied product facts.