## COPY

**Headline:** Keep tax money separate from spending money.

**Body:** Keel automatically sets aside a calculated share of each client payment, updates your tax estimate, and reminds you before quarterly deadlines. Keep your subscription to keep those set-asides and reminders working for you.

**Primary stay action:** Keep my subscription

**Secondary action:** Continue to cancellation

**Confirm-cancel label:** Cancel my subscription

## TEST PLAN

- **Control:** Current plain “Are you sure?” dialog.
- **Variant:** Save screen above, with no discount. “Continue to cancellation” opens the final confirmation.
- **Assignment:** Randomize users 50/50 at their first cancellation attempt; keep assignment consistent on repeat visits.
- **Primary metric:** Percentage of first cancellation attempts ending without cancellation, using the same measurement window as the 12% baseline.
- **Sample and duration:** Approximately **660 users total**, or **10 weeks** at 300 attempts/month. This detects an increase from **12% to 20%** with approximately 80% power at a two-sided 5% significance level. That is a detection target, not a forecast.
- **Guardrails:** Check 30-day paid retention, refunds, and cancellation-related complaints. Immediate saves that quickly cancel again offer little value.
- **Decision:** Complete the sample without stopping early for significance; allow another 30 days for retention follow-up. Ship if saves improve significantly, retention supports the result, and guardrails show no material harm.
- **Assumptions:** Most attempts represent distinct users, and the baseline applies to first attempts. Repeat attempts extend recruitment. Smaller improvements require a longer test.

## RATIONALE

The copy uses the “money that isn’t mine” framing and emphasizes work Keel does automatically. It avoids promising sufficient tax savings or penalty prevention.

No offer: first test whether the ongoing benefit earns the renewal. Keep cancellation actions clearly visible and neutrally styled so the test measures persuasion rather than difficulty leaving.