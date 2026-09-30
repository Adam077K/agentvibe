## COPY

**Subject A:** Nothing's happening in your Keel account
**Subject B:** One step stands between you and surprises

**Preheader:** Read-only, bank-level security via Plaid. Takes about 2 minutes — then Keel starts working.

**Body:**
Right now Keel is watching an empty account. Nothing moves, nothing gets set aside, nothing gets tracked — because it isn't connected to anything yet.

Once you link your bank, Keel does the one job that matters: pulls a percentage out before you ever see it as spendable, so quarterly deadlines stop being a guessing game.

It's read-only access through Plaid — bank-level encryption, no ability to move money anywhere Keel doesn't already tell you about.

**CTA button:** Connect Your Bank (2 min)

## TEST PLAN

- **Control:** current email — subject "Finish setting up Keel," generic "connect your bank to get started" body.
- **Variant:** copy above.
- **Metric (primary):** % of recipients who connect a bank within 7 days of email send.
- **Guardrail metrics:** unsubscribe rate, spam-complaint rate (bank-trust messaging carries some risk of feeling invasive).
- **Split:** 50/50 random assignment at send time.
- **Volume:** ~990 recipients/week (1,800 × 55%) → ~495/arm/week.
- **Sample size:** to detect a 5-point absolute lift (41% → 46%, ~12% relative) at 80% power, α=0.05 two-sided, need ≈1,540 recipients per arm.
- **Duration:** run 4 weeks (~1,980/arm) — covers the required sample with buffer and spans weekly signup-mix variation (day-of-week, campaign source).
- **Decision rule:** ship variant if it beats control on primary metric with no guardrail regression >20% relative; otherwise keep control and test a second variant isolating subject line vs. body.

## RATIONALE

Both subject lines lead with the account's current inert state rather than a generic task ("finish setup"), because the corpus's dominant pain is surprise/not-knowing (Q6, Q7, Q14, Q18) — "nothing's happening" creates useful discomfort without being alarmist. The body reframes bank connection as the trigger for the anti-effort promise users actually want (Q4, Q10, Q19: acted on automatically, not another dashboard) rather than as a setup chore. It preempts the bank-security objection (Q12) directly and briefly rather than burying it, since that's the most likely reason a non-connector stalls. No mention of tax filing, since scope confusion (Q16) isn't relevant to this send and correcting it here would dilute the CTA.