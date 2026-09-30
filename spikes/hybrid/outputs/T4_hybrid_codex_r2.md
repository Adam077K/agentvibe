## COPY

**Headline:** Keep tax money out of spending money.

**Body:** Keel automatically moves a calculated share of each client payment into your tax pot and keeps a running estimate of what you owe. Less mental math. Fewer unknowns. Keeping your subscription continues your current plan and price. Keel doesn’t file taxes.

**Primary stay action:** Keep my subscription

**Secondary action:** Cancel subscription

**Confirm-cancel label:** Cancel subscription  
*The secondary action confirms cancellation directly; no additional confirmation screen.*

## TEST PLAN

**Design:** Randomize eligible paying users 50/50 at their first cancellation attempt: current “Are you sure?” dialog versus save screen. Persist assignment; count each user once. Assume 300 unique users/month and that the supplied baseline matches the measurement window below.

**Primary metric:** Users who have not cancelled within 24 hours ÷ all randomized users. Include abandoned flows in the denominator. Report explicit “keep” selections separately to distinguish deliberate saves from abandonment.

**Hypotheses:** H0: save rates are equal. H1: save rates differ. Two-sided α = 0.05; power = 80%.

**Feasibility:** Detecting 12% → 18% (+6 percentage points; +50% relative) requires approximately 555 users/arm, or **17 weeks**. That exceeds a reasonable eight-week horizon.

**Chosen alternative:** Test only for a large effect: 12% → 24%, **+12 percentage points / +100% relative**. This is a sensitivity threshold, not a forecast.

With \(p_1=.12\), \(p_2=.24\), \(\bar p=.18\), \(z_{1-\alpha/2}=1.96\), and \(z_{1-\beta}=.84\):

\[
n=\frac{\left[1.96\sqrt{2(.18)(.82)}
+.84\sqrt{(.12)(.88)+(.24)(.76)}\right]^2}{(.24-.12)^2}
\approx159.5
\]

Round up to **160 users/arm**, 320 total.

**Duration:** \(300 \times 12/52 \approx 69.2\) users/week.  
\(320/69.2=4.62\) weeks → **five full weeks**, approximately 173 users/arm.

**Pre-commitment:** Freeze copy, allocation, metric and five-week enrollment horizon before launch. No interim efficacy checks or significance-driven extensions. Analyze after the final user’s 24-hour window. Report the absolute difference, relative lift and 95% confidence interval. A nonsignificant result cannot rule out smaller useful gains.

**Guardrails:** Cancellation completion time, cancellation-related complaints, refunds/chargebacks, and 30-day paid retention across all randomized users. Review mature 30-day outcomes before rollout; an immediate save increase alone is insufficient. Keep cancellation equally visible and equally easy in both arms.

## RATIONALE

- **Headline — Q2, Q3:** Mental accounting separates tax money from spendable income using the customers’ “money that isn’t mine” distinction.
- **Body — Q3, Q4, Q6, Q7, Q18:** Cognitive offloading and ambiguity reduction address forgotten calculations and uncertain amounts. Scope clarity answers Q16; explicit unchanged pricing supports informed choice.
- **Primary action — Q4, Q17, Q19:** Continuity preserves useful automation for people who stop maintaining financial tools; the label makes the subscription consequence explicit.
- **Secondary action — Q4, Q5:** Agency and low effort fit customers who value simplicity and respectful treatment.
- **Confirm-cancel label — Q4, Q5:** Unambiguous wording avoids another decision burden.
- **No offer:** The corpus does not establish price-driven cancellation; Q20 suggests perceived value. These quotes support messaging hypotheses, not proven cancellation motives.