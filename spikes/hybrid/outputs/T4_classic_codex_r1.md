## COPY

**Headline:** Keep setting aside tax money automatically.

**Body:** When clients pay, Keel moves a calculated percentage into your tax pot. Your running estimate and quarterly reminders help you see what’s coming—without keeping up a spreadsheet. Keep Keel for automatic set-asides, or cancel below.

**Primary stay action:** Keep my subscription

**Secondary action:** Back to settings

**Confirm-cancel action:** Cancel my subscription

## TEST PLAN

- **Control:** Current plain “Are you sure?” confirmation.
- **Variant:** Copy above, replacing the existing dialog. No discount or additional cancellation step. Give cancellation a clearly visible button.
- **Assignment:** Randomize paying subscribers 50/50 at their first cancellation attempt; retain their assignment on repeat visits.
- **Primary metric:** Explicit saves ÷ unique subscribers entering the flow. Count “Keep my subscription” as a save; exclude exits, back navigation, and abandonment from saves.
- **Guardrails:** Cancellation completion time, cancellation-related support contacts, and the percentage of entrants still paying 30 days later. An immediate save lift without durable retention is insufficient.
- **Sample and duration:** Approximately **660 unique subscribers total**, designed to detect an increase from **12% to 20%** with 80% power at a two-sided 5% significance level. At 300 attempts/month, enrollment takes roughly **10 weeks**, followed by 30 days for retention measurement.
- **Decision:** Analyze once the fixed sample and follow-up are complete. Ship if saves improve significantly, retention supports the improvement, and cancellation guardrails show no material deterioration. Otherwise report the result as inconclusive or negative.

**Assumptions:** The 12% baseline represents explicit saves, and most attempts are from unique subscribers. Validate before launch; repeat attempts will extend enrollment. The eight-point lift is a detection target, not a forecast.

## RATIONALE

The copy connects automatic set-asides with less uncertainty and less spreadsheet upkeep. It avoids guilt, penalty threats, and promises that taxes are fully covered. No offer: the corpus does not establish price as the reason paying users cancel. Keeping cancellation direct also helps distinguish persuasive copy from added friction.