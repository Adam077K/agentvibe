## COPY

**Headline:** Stop Guessing What You Owe The IRS

**Value line:** Keel sets your tax money aside the moment it lands, so quarterly deadlines stop being a surprise.

**Plan card**
- **Plan name:** Keel
- **Benefit 1:** Moves tax money out before you see it
- **Benefit 2:** Always shows exactly what you owe
- **Benefit 3:** Handles lumpy income — one payment or ten
- **CTA:** Start Free Trial — No Card Needed

## TEST PLAN

**Change:** Control defaults to $12/mo billed monthly. Variant defaults to annual, framed as "$9/mo, billed $108/yr" with a visible toggle to switch to $12/mo monthly. Assumption: framing as a monthly-equivalent number reduces sticker shock of the $108 lump sum while still capturing the annual commitment.

**Hypotheses:** H0: trial-start rate(variant) = trial-start rate(control). H1: rates differ (two-sided — annual-default could help via lower perceived monthly cost, or hurt via upfront-commitment friction).

**Primary metric:** Trial starts ÷ unique pricing-page visits (same definition as the 6.0% baseline).

**Design parameters:** MDE = +1.0pp absolute (6.0%→7.0%, +16.7% relative) — smallest lift worth shipping for. α=0.05 two-sided (z=1.96), power=80% (z=0.84).

**Sample size:**
p̄=0.065 → 2p̄(1−p̄)=0.1216, √=0.3486
p1(1−p1)+p2(1−p2)=0.0564+0.0651=0.1215, √=0.3486
Numerator = (1.96×0.3486 + 0.84×0.3486)² = (0.9767)² = 0.9539
n = 0.9539 / (0.01)² = **9,540 visits/arm** (≈19,080 total)

**Duration:** 2,400 visits/wk → 1,200/arm/wk → 19,080 ÷ 2,400 = 7.95 wks → **8 weeks**. This sits right at the acceptable ceiling — tight but workable. If traffic drops, widen MDE to 1.5pp (n≈4,260/arm, ~4 weeks) rather than extend past 8 weeks.

**Protocol:** 50/50 visitor-level randomization, persistent bucketing. Fixed 8-week horizon, single analysis at the end — no interim peeking. If early monitoring is required, use an O'Brien-Fleming spending function with ≤2 interim looks instead of naive peeking.

**Guardrails:** trial→paid conversion rate (Day 7), 30-day refund/cancellation rate, revenue per visitor, support tickets tagged "billing confusion."

## RATIONALE

- Headline: "guessing" / "owe" = customer's own words (Q7, Q14) — mechanism: ambiguity aversion, the dread is not-knowing (Q6).
- Value line: "the moment it lands" — anti-dashboard, pre-emptive action (Q4); "any other day" mirrors Q9's "a Tuesday" — mechanism: reducing anticipated regret.
- Bullet 1: direct quote intent of Q4 — mechanism: mental accounting, removing the decision point before temptation (Q2, Q3).
- Bullet 2: Q6/Q14 — mechanism: certainty reduces cognitive load, not effort.
- Bullet 3: Q8 — addresses a stated capability objection directly.
- CTA "No Card Needed": pre-empts the Q12 trust objection at the point of action.
- Annual framing as monthly-equivalent: mechanism: anchoring on the smaller number to blunt sticker shock, testing against the "penalty, not price" justification in Q20/Q11.