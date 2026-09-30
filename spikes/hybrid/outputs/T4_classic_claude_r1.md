## COPY

**Headline:** Your tax pot stops filling the moment you cancel.

**Body (53 words):** Cancel now and Keel stops moving money into your tax pot — you're back to guessing what you owe until the next deadline hits. Not ready to commit? Pause for 60 days at no charge; your pot and running estimate stay exactly where you left them, ready the moment you turn it back on.

**Primary (stay) action:** Keep the auto-save on

**Secondary action (offer):** Pause my plan for 60 days instead

**Confirm-cancel label:** No thanks, cancel my subscription

## TEST PLAN

- **Control (A):** current plain "Are you sure?" confirm dialog.
- **Variant (B):** save screen above.
- **Split:** 50/50, randomized per user at first cancel-click; repeat attempts by the same user stay in their original arm.
- **Primary metric:** % of cancellation attempts that end in "stayed" (user does not complete cancel), including both full stay and pause-offer takers.
- **Guardrail metrics:** (1) Day-90 net retention of "stayed" users, to confirm the pause offer delays churn rather than just deferring it; (2) support tickets mentioning billing/pause confusion.
- **Sample size:** baseline 12%. To detect a lift to ~20% stay rate (+8pp, 67% relative, a realistic bar for a well-targeted save screen) at 95% confidence / 80% power needs ~325 attempts per arm.
- **Duration:** at 300 attempts/month (150/arm/month), that's ~9–10 weeks. Run a minimum of 8 weeks; extend to 12 if the result is inconclusive rather than stopping early on a peek.
- **Decision rule:** ship B if the stay-rate lift is significant (p<0.05) and Day-90 guardrail retention isn't negative versus A.

## RATIONALE

Headline and body use loss framing on the tax pot rather than generic "you'll miss out" language, because the corpus's dominant pain is surprise/not-knowing (Q6, Q7, Q14, Q18), not the tax itself — losing the automatic set-aside is what reintroduces that anxiety. The pause offer, not a discount, respects the anti-effort/anti-dashboard preference (Q4, Q10, Q19): it removes the decision entirely rather than asking for more engagement. Avoided any penalty-dollar figure or filing language to stay clear of the scope confusion in Q16 (Keel doesn't file). Confirm-cancel is worded plainly, not guilt-heavy, since Q5's "doesn't make me feel stupid" trust cue should hold even at exit.