## COPY

**Headline:** Taxes you can see coming.

**Subhead:** Keel automatically moves a calculated share of each client payment into a separate tax pot and keeps a running estimate of what you owe.

**CTA:** Start my free trial

**Microcopy:** 14 days free. No card required. Bank connection via Plaid. Plans: $12/month or $108/year. Does not file taxes.

## TEST PLAN

- **Design:** Randomize unique visitors 50/50 between the supplied control and this complete hero, including microcopy. Persist assignment across visits; change nothing else. Assume 9,000 newly eligible unique visitors weekly and a baseline measured over the conversion window below.
- **Primary metric:** Unique visitors starting a trial within seven days of assignment ÷ all unique visitors assigned to that arm.
- **Hypotheses:** H₀: p_variant = p_control. H₁: p_variant ≠ p_control.
- **Pre-chosen MDE:** **25% relative lift**, from **3.2% to 4.0%**: **+0.8 percentage points** absolute. Two-sided α = 0.05; power = 80%.

**Sample size per arm:**

With p₁ = 0.032, p₂ = 0.040, p̄ = 0.036, z₁₋α/₂ = 1.96 and z₁₋β = 0.8416:

\[
n=\frac{\left[1.96\sqrt{2(0.036)(0.964)}
+0.8416\sqrt{(0.032)(0.968)+(0.040)(0.960)}\right]^2}
{(0.040-0.032)^2}
\approx 8{,}512
\]

- **Fixed horizon:** 17,024 required visitors ÷ 9,000/week = 1.89 weeks, rounded up to **two weeks of enrollment**. Expect 9,000 visitors per arm. Allow seven additional days for outcomes to mature; analyze on **day 21**. No peeking at conversion results, early stopping or outcome-driven extensions.
- **Decision:** Declare a conversion win only for a positive difference with two-sided p < 0.05. Report absolute and relative lift with 95% confidence intervals. An inconclusive result does not establish equivalence.
- **Guardrails:** Seven-day bank connections per randomized visitor; bank-connection failures per attempted connection; security or filing-confusion support contacts per trial starter; page-load performance. Review adverse movement before rollout. These are diagnostic checks, not powered proof of safety.

## RATIONALE

- **Headline — ambiguity aversion:** Q6 dreads “not knowing”; Q7 questions a stale estimate; Q18 wants something they “can see coming.” Visibility directly addresses the dominant uncertainty pain.
- **Subhead — mental accounting and reduced effort:** Q2’s “money that isn’t mine” and Q3’s forgotten allocation support a separate pot. Q4 wants money moved automatically; Q10 and Q19 show manual upkeep fails.
- **CTA — reduced initiation friction:** Q17 values quick setup; Q4 wants the work handled. A free trial offers a low-commitment first step.
- **Microcopy — uncertainty reduction:** Q12 motivates naming the bank connector; Q16 requires explicit filing boundaries. Trial and price terms make the commitment clear. Plaid’s name is not a security guarantee.

Product facts support the offer details; quotes motivate their framing.