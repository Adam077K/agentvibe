## COPY

**Headlines (5, ≤30 chars):**
1. Quarterly Taxes, Handled — 24 chars
2. Estimated Tax, Simplified — 25 chars
3. No More Tax-Day Surprises — 25 chars
4. Avoid The Underpayment Fee — 26 chars
5. Start Your Free 14-Day Trial — 28 chars

**Descriptions (2, ≤90 chars):**
1. For self-employed freelancers: Keel sets aside taxes from every payment, automatically. — 87 chars
2. Bank-secure via Plaid. No card required. 14-day free trial. Avoid next year's penalty. — 86 chars

## TEST PLAN

**Setup:** Control = current live RSA in this ad group (unchanged). Variant = the copy above, added as a second ad in the same ad group with "optimize: do not rotate evenly" turned off (force even rotation) so Google's algorithm doesn't pick a winner before you do. Same landing page, keywords, and bids for both. Split 50/50.

**Assumptions:** 40,000 impressions/week on the cluster → 20,000/arm/week. At baseline (4.1% CTR, 3.0% click→trial), that's ~820 clicks and ~24.6 trial starts per arm per week.

**Primary metric: trial starts per impression** (overall search→trial conversion rate). Not CTR — a curiosity headline can lift CTR while pulling in the wrong searchers (e.g., calculator tourists, not freelancers with lumpy 1099 income), which the corpus flags as a real risk (Q16 confuses scope; Q4/Q19 punish anything that feels like "another dashboard" pitch). Trial starts per impression is the only single number that reflects both "did the headline earn a click" and "did the promise match what the click found," and it's the number tied to revenue.

**Guardrails:** CTR (flag if it drops >15% relative — protects volume/CPC) and cost-per-trial-start (flag if it rises).

**Sizing (two-sided z-test, α=0.05, power=80%):**
- Baseline overall conversion: p1 = 4.1% × 3.0% = 0.123%
- MDE: 30% relative lift (p2 ≈ 0.160%) — chosen because smaller lifts aren't worth the calendar time a low base-rate metric demands, and a copy-only change should clear a meaningful bar
- Required sample: ≈163,000 impressions per arm (≈326,000 total)
- At 20,000 impressions/arm/week: **≈8–9 weeks**

**Practical run rules:** Do one guardrail-only check at week 4 (stop early only for a severe CTR/cost blowup, never to call an early "win" — avoids peeking bias). Run the full 8–9 weeks regardless of interim significance, since freelancer payment/search behavior likely varies with pay cycles and needs multiple weeks to average out. If a faster read is needed, CTR alone reaches good power (~10% relative MDE) in ~2 weeks and can serve as an early directional signal — but the decision to ship is made on trial starts per impression, not CTR.

## RATIONALE

Headlines lead with the two literal keyword phrases ("Quarterly Taxes," "Estimated Tax") for relevance, then pivot to the corpus's real pain — not the tax itself but the *not-knowing* (Q6, Q7, Q14, Q18) and the penalty fear (Q11, Q20) — rather than generic "budgeting app" language the audience already distrusts (Q10, Q19). Description 1 states the anti-dashboard, done-for-you mechanism (Q4: "take the money out before I see it"). Description 2 pre-empts the two live objections nearest the CTA — bank-connection trust (Q12) and cost (Q20 reframes price against the penalty, not against other apps) — plus the no-card-required trial detail to lower signup friction.