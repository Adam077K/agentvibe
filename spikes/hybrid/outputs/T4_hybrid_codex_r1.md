## COPY

**Headline:** Keep tax money separate.

**Body:** Keel keeps moving a calculated share of client payments into your tax pot and updating your tax estimate. Less mental math. Fewer surprises. Keeping your subscription continues your current plan and price. Keel doesn’t file taxes.

**Primary stay action:** Keep my subscription

**Secondary action:** Continue to cancellation

**Confirm-cancel label:** Cancel subscription

**Offer:** None.

## TEST PLAN

- **Design:** Randomize subscribers 1:1 between the current confirmation dialog and this screen. Persist assignment; count only each subscriber’s first cancellation attempt. Keep cancellation equally accessible.
- **Assumptions:** Approximately 300 unique eligible subscribers/month; the 12% baseline holds after deduplication.
- **Primary metric:** Explicit decisions to retain the subscription during the first cancellation flow ÷ all randomized subscribers opening that flow. Abandonment does not count as a save. Verify the baseline uses this definition before launch.
- **Hypotheses:** H0: \(p_T=p_C\). H1: \(p_T\ne p_C\).
- **Preselected MDE:** **+75% relative; +9 percentage points absolute**, from 12% to 21%.
- **Error rates:** Two-sided \(\alpha=0.05\); 80% power.

With \(p_1=0.12\), \(p_2=0.21\), \(\bar p=0.165\), \(z_{1-\alpha/2}=1.96\), and \(z_{1-\beta}=0.842\):

\[
n=\frac{\left[1.96\sqrt{2(0.165)(0.835)}
+0.842\sqrt{(0.12)(0.88)+(0.21)(0.79)}\right]^2}
{(0.21-0.12)^2}
\]

\[
n\approx\frac{(1.0289+0.4387)^2}{0.0081}
\approx265.9
\Rightarrow \boxed{266\text{ subscribers per arm}}
\]

**Duration:** \(532/300=1.77\) months. Using 30.44 days/month: \(1.77\times30.44/7=7.71\) weeks. Pre-commit to **eight full weeks**, yielding approximately 552 subscribers.

**Decision:** No interim efficacy checks, early stopping, or extensions based on results. Analyze once after eight weeks; report the absolute lift and 95% confidence interval. Require a positive, statistically significant result to claim improvement. If traffic misses the required sample, report inadequate power.

**Feasibility:** This can detect only a large improvement. A 25% relative lift—12% to 15%—needs approximately 2,036 subscribers per arm, or **60 weeks**. That is impractical here. The honest alternative is this larger-MDE test; a nonsignificant result cannot rule out useful smaller gains.

**Guardrails:** Cancellation completion and time among subscribers choosing to proceed; cancellation-related complaints; refunds/chargebacks; 30-day re-cancellation and paid retention. Follow the last cohort for 30 days before the rollout decision; these checks extend observation beyond enrollment and may be imprecise.

## RATIONALE

Dominant pains: spendable-looking tax money (Q2/Q3), uncertainty (Q6/Q18), and upkeep fatigue (Q4/Q10/Q19).

- **Headline — Q2/Q3:** Mental accounting makes separating tax money the concrete benefit.
- **Body — Q3/Q4/Q6/Q18:** Cognitive offloading and ambiguity reduction fit forgotten calculations and unpredictable obligations. Q16 supports the filing clarification; current-price disclosure makes the commitment explicit without promising penalty avoidance.
- **Stay action — Q4/Q17:** Continuity preserves the automation customers value; the label explicitly names the subscription commitment.
- **Secondary action — Q5/Q12:** Autonomy supports a respectful, trust-sensitive experience. These quotes support that inference, not a demonstrated cancellation preference.
- **Confirm-cancel — Q5/Q12:** Unambiguous action wording supports informed choice; the same inference applies.
- **No offer — Q20:** Price acceptance appears in the corpus; price-driven cancellation does not. A discount lacks evidence here.