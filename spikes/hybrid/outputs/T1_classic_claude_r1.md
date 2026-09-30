## COPY

**Headline:** Your tax money, gone before you spend it.
**Subhead:** Keel sets aside a percentage the moment a client pays, tracks what you owe, and reminds you before every quarterly deadline.
**Primary CTA:** Start my free trial
**Microcopy:** No card needed. Bank-level security via Plaid.

## TEST PLAN

- **Control:** "Smart tax savings for freelancers" / "Automate your estimated taxes with Keel." / "Start free trial"
- **Variant:** copy above
- **Primary metric:** trial starts ÷ unique visitors (baseline 3.2%)
- **Guardrail:** trial-to-paid conversion (watch for quality drop, don't act on it this round)
- **Split:** 50/50, randomized per visitor
- **Minimum detectable effect:** 20% relative lift (3.2% → 3.84%, +0.64pp) — smallest lift worth shipping
- **Sample size:** ~13,000 visitors/arm (26,000 total) for 95% confidence, 80% power, two-sided test
- **Duration:** at 9,000 uniques/week (4,500/arm/week) → **3 full weeks**, stopped only at a week boundary to avoid weekday/weekend skew
- **Decision rule:** ship variant if it wins on primary metric at significance and guardrail hasn't dropped >1pp

## RATIONALE

Dominant pain is surprise, not tax amount (Q6, Q7, Q14, Q18) — headline leads with removing surprise, not with "savings" or "smart," which sound like more work to manage. "Gone before you spend it" mirrors the "money that isn't mine yet" framing (Q2, Q3) and the anti-effort ask (Q4, Q10). CTA emphasizes the trial, not tax filing, avoiding the scope confusion in Q16. Microcopy pre-empts the bank-connection trust objection (Q12) and removes the card-required friction. Control's "smart" and "automate" are vaguer and don't name an outcome — testing against a concrete, felt-benefit headline should move activation.