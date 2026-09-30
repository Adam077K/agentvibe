## COPY

**Subject option 1:** Give your tax money its own place  
**Subject option 2:** Set aside tax money automatically  
**Preheader:** Connect your bank so Keel can start setting money aside when clients pay.

**Body:**

Some of the money in your account already has a job: paying taxes.

Connect your bank, and Keel will automatically move a calculated percentage of incoming client payments into a separate tax pot. Less mental math after each payment. Less guessing before quarterlies.

You’ll also get a running estimate of what you owe and reminders before quarterly deadlines.

Keel uses Plaid to connect your bank. It helps you prepare for taxes; it doesn’t file them.

**CTA:** Connect my bank

## TEST PLAN

- **Control:** Current email: “Finish setting up Keel” with generic setup copy.
- **Variant:** Subject option 1, preheader, and body above. Reserve option 2 for a later test.
- **Hypothesis:** Explaining automatic set-asides and addressing bank connection uncertainty will increase activation.
- **Assignment:** Randomize eligible users 50/50; exclude anyone already connected at send time. Keep timing, sender, and destination identical.
- **Primary metric:** Percentage of recipients who successfully connect a bank within seven days. Compare absolute percentage-point lift.
- **Sample and duration:** Expect 990 eligible recipients/week. Assuming a 41% baseline, approximately 1,550 recipients per arm detect a lift to 46% with 80% power at two-sided 5% significance. Enroll for four full weeks, then allow seven days for final outcomes: **five weeks total**.
- **Decision:** Analyze once at completion. Ship if activation improves with statistical significance; otherwise retain control. Monitor unsubscribes and spam complaints.

## RATIONALE

The copy connects a necessary setup step to the desired outcome: separating tax money before it gets spent. Plaid addresses the bank connection question without unsupported security promises. The test measures the full email’s effect; it cannot isolate the subject line’s contribution.