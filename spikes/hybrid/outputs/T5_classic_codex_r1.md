## COPY

**Headline 1:** Freelancer Quarterly Taxes — **26 characters**  
**Headline 2:** See Your Estimated Tax — **22 characters**  
**Headline 3:** Tax Money Set Aside for You — **27 characters**  
**Headline 4:** Start Your 14-Day Free Trial — **28 characters**  
**Headline 5:** No Card Needed to Start — **23 characters**

**Description 1:** Keel moves part of each client payment into a tax pot and tracks your estimated tax. — **84 characters**

**Description 2:** Connect your bank via Plaid. Get quarterly reminders. $12/month. Does not file taxes. — **85 characters**

## TEST PLAN

- **Control:** Current ad, unchanged.
- **Variant:** RSA above. Test the complete asset set; results won’t identify individual headline effects.
- **Setup:** Randomized 50/50 campaign experiment. Keep keywords, targeting, bids, budget allocation, landing page, and asset-pinning rules consistent.
- **Primary metric:** Trial starts per impression. This captures both click attraction and post-click intent; CTR alone could reward calculator seekers who never start a trial.
- **Baseline:** 4.1% CTR × 3.0% click-to-trial rate = **0.123% trials per impression**, or **49.2 trials/week** across the cluster.
- **Sizing assumptions:** Detect a **25% relative lift**, from 0.123% to 0.15375%, using 80% power and a two-sided 5% significance level. Approximate two-proportion calculation requires **230,000 impressions per arm; 460,000 total**.
- **Duration:** At 40,000 impressions/week, approximately 11.5 weeks. Schedule **12 full weeks**, extending if either arm hasn’t reached its sample target. Assume a seven-day conversion window; wait seven additional days for final attribution.
- **Decision:** Adopt the variant if trial starts per impression improves with statistical significance. Otherwise, report the result as inconclusive or unfavorable. Use CTR and click-to-trial rate to explain performance; don’t stop early for apparent wins.

## RATIONALE

The copy pairs search relevance with the desired outcome: knowing the estimate and having tax money set aside. Trial language makes the next step explicit. Plaid identifies the connection provider without inventing security guarantees; “Does not file taxes” addresses scope confusion. Pricing helps qualify clicks from people seeking a free calculator.