## COPY

**Headline:** Cancel now, and April goes back to guessing.

**Body (51 words):** You started Keel so a client payment wouldn't quietly become money you owe. Cancel now and the tax pot stops filling — no savings, no reminders, no heads-up before the next deadline. If it's timing, pause instead: we hold off moving money and switch back on before your next quarterly due date.

**Primary ("stay") action:** Keep My Tax Pot Active

**Secondary action (offer):** Pause Instead — Free for 90 Days

**Confirm-cancel label:** No thanks, cancel my subscription

*Offer detail:* Pause freezes billing and the auto-transfer; the tax pot stays untouched and reminders resume automatically before the next quarterly deadline (or in 90 days, whichever is sooner). No discount — price is defended against the penalty, not against other apps, so cheapening it would undercut that logic.

## TEST PLAN

- **Control:** current plain "Are you sure?" confirm dialog.
- **Variant:** save screen above, 50/50 randomized at the moment "Cancel subscription" is clicked.
- **Primary metric:** save rate — % of cancellation attempts that do not end in confirmed cancellation (target: lift from 12% baseline to ≥18%).
- **Secondary metrics:** (1) pause-adoption rate among stayers, to see if the offer or the plain "keep active" click drives saves; (2) 30/60-day re-cancellation rate among stayers, to confirm this is retention, not a delayed cancel.
- **Sample size:** ~550 attempts per arm needed to detect a 12%→18% lift at 95% significance / 80% power.
- **Duration:** at ~300 attempts/month (150/arm), that's ~3.5–4 months. Run a minimum of 8 weeks before peeking, extend to ~16 weeks to hit the required n, and make sure the window spans at least one quarterly deadline (Apr 15 / Jun 15 / Sep 15 / Jan 15) since cancel intent likely spikes right after a payment — avoids a biased read from only pre- or post-deadline traffic.
- **Decision rule:** ship variant if save rate lift is statistically significant and the 60-day re-cancel rate among variant "stayers" isn't materially higher than control's.

## RATIONALE

The dominant pain is surprise, not the tax amount (Q6, Q7, Q14, Q18) — so the headline threatens the return of not-knowing, not a discount pitch. The penalty framing (Q11, Q20) does the persuasion: staying is cheap insurance, not a sale. Pause (not %-off) respects "money that isn't mine" trust and avoids discounting a price users already justify against a penalty, not competitors. It also serves the anti-effort segment (Q4, Q10, Q19): one click resumes protection with zero setup, addressing lumpy-income/timing cancels without a hard sell.