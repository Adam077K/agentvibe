## COPY

**Headline:** Cancelling turns the tracking off — not the taxes.

**Body (57 words):** Right now Keel is already setting money aside for your next quarterly and tracking exactly what you owe. Cancel today and that stops immediately — no more automatic set-asides, no reminder before your next deadline. You're back to guessing until the number shows up in April. One underpayment penalty typically costs more than a full year of Keel.

**Primary ("stay") action:** Keep my tax pot running

**Secondary action (offer):** Pause instead — skip billing until my next deadline

**Confirm-cancel label:** No thanks, cancel my subscription

## TEST PLAN

**Design:** 50/50 randomization at the "Cancel subscription" click, session/account-level bucketing (sticky per user). Arm A (control): plain "Are you sure?" dialog. Arm B: save screen above.

**Hypotheses:** H0: p_B ≤ p_A (save rate of new screen no better than control). H1: p_B > p_A. One-sided, pre-registered — the only decision this test informs is "ship B or don't"; a screen that underperforms control is simply not shipped, so there's no separate action for "significantly worse," which justifies the one-sided test.

**Primary metric:** Save rate = (cancellation attempts that do not complete cancellation in-session) / (total cancellation attempts), i.e., users who land on the screen but keep the subscription active (via primary or secondary action).

**MDE:** Baseline p1 = 0.12. Minimum detectable effect = +8pp absolute (p2 = 0.20), relative lift = +67%. Chosen because it's the largest MDE consistent with keeping the test inside ~8 weeks at this volume — see feasibility note below.

**Alpha/power:** α = 0.05 (one-sided), power = 0.80.

**Sample size (two-proportion formula):**
pbar = 0.16; 2·pbar·(1-pbar) = 0.2688, √ = 0.5185; z(0.95)=1.6449 → term1 = 0.8528
p1(1-p1)=0.1056, p2(1-p2)=0.16, sum=0.2656, √=0.5154; z(0.80)=0.8416 → term2 = 0.4337
n = (0.8528+0.4337)² / (0.08)² = 1.6551 / 0.0064 ≈ **259 per arm** (518 total).

**Duration:** 300 attempts/month ≈ 69/week total, ≈34.6/arm/week. 259 ÷ 34.6 ≈ 7.5 weeks → **run 8 weeks**, fixed horizon, no interim looks, one analysis at the end (or at n=518, whichever comes later).

**Feasibility flag:** a realistic, smaller effect (e.g., +3pp, relative +25%) would need ~2,034/arm — over 13 months at this volume, not viable. This plan only has power for a large effect. If the actual lift is smaller, extend to a pooled/rolling test (accumulate quarters) or treat this as a directional pilot and re-power once true effect size is observed.

**Guardrails:** (1) 30-day re-cancellation rate among "saved" users in each arm — catches delayed-churn masquerading as a save; (2) support tickets tagged "confused"/"tricked" post-cancellation flow; (3) pause→cancel conversion rate for users who take the pause offer.

## RATIONALE

Headline/body use loss aversion + status quo bias: framing cancellation as switching *off* an existing protection restores the exact dread named in Q6/Q18 ("not the amount — the not knowing"). "Money... sitting in your account" callback to Q2/Q3 (endowment: the pot already feels theirs). Penalty-vs-price anchor (Q11, Q20) reframes $12/mo against a concrete loss, not a subscription cost. Primary CTA "Keep my tax pot running" uses continuity/ownership language, not generic "Subscribe," matching anti-dashboard, anti-effort sentiment (Q4, Q10, Q19). Pause offer reduces switching cost to zero loss and fits lumpy-income reality (Q8) rather than forcing binary stay/cancel. Confirm-cancel stays plain and unshamed — this audience is already wary of trusting a finance app with their bank (Q12); a guilt-trip risks the exact trust Q5/Q13 say Keel earned.