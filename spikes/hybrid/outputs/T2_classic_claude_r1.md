## COPY

**Headline:** Set aside your taxes before you ever see the money.

**Value line:** Keel pulls the right amount from every client payment into a separate tax pot, so you always know what you owe — with a reminder before every quarterly deadline (Apr 15, Jun 15, Sep 15, Jan 15).

**Plan card**
- **Plan name:** Keel Freelancer Plan
- **Bullets:**
  1. Automatically sets aside taxes before you ever see them.
  2. Always know exactly what you owe — no guessing.
  3. Bank-level security via Plaid, same tech your bank uses.
- **CTA label:** Start Free 14-Day Trial — No Card Required

## TEST PLAN

- **Control:** Pricing card shows $12/mo by default (toggle to annual).
- **Variant:** Pricing card shows $9/mo, billed annually ($108/yr — save 25%) by default (toggle to monthly).
- **Split:** 50/50, randomized per visitor, persistent for session.
- **Primary metric:** Trial starts ÷ pricing-page visits (baseline 6.0%).
- **Guardrail/secondary metrics:** Trial-to-paid conversion rate, % of trials on annual plan, projected revenue per visit (RPV) — because a default that changes plan mix can move revenue even if trial-start rate doesn't.
- **Sample size:** To detect a ~1.5pp lift (6.0%→7.5%, ~25% relative) at 95% confidence / 80% power needs ≈4,400 visits per arm.
- **Duration:** At 2,400 visits/week (1,200/arm), that's ~4 weeks to read trial-start rate. Hold the cohort open a further ~2 weeks (14-day trial + payment processing) before reading paid-conversion/RPV — decide on trial-start rate at week 4, confirm on RPV at week 6. Don't call it early on trial-start alone if RPV hasn't stabilized.

## RATIONALE

Headline and bullet 1 target the corpus's strongest, most consistent pain: money that "isn't mine yet but looks like mine" (Q2, Q3) and the demand to have it removed before it's seen, not tracked in a dashboard (Q4, Q10, Q19). Bullet 2 targets certainty over amount — the dread is not-knowing (Q6, Q14, Q18). Bullet 3 pre-empts the bank-trust objection (Q12) right where they're about to connect an account. CTA removes the friction that trial/card hesitation adds.

For the test: defaulting to annual raises commitment and likely LTV, but $108 sticker shock could suppress top-of-funnel trial starts — so trial-start rate stays primary, while paid-conversion and plan-mix guard against a "win" that's really just cheaper trials with worse economics.