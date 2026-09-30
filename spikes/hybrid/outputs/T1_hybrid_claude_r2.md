## COPY

**Headline:** Your tax money, moved before you see it.

**Subhead:** Keel sets aside taxes the moment a client pays, so you always know the number — and April never surprises you.

**CTA button:** Start My Free Trial

**Microcopy:** No card needed — bank link secured by Plaid.

## TEST PLAN

**H0:** trial-start rate of variant hero = control hero (p_v = p_c)
**H1:** p_v ≠ p_c (two-sided)
**Primary metric:** unique trial starts ÷ unique hero-page visitors (first-touch, 1 per visitor)
**Baseline (control):** p1 = 3.2%
**MDE:** +20% relative (0.64 pp absolute) → p2 = 3.84%. Chosen as the smallest lift worth shipping given dev/design cost of a hero swap.
**α = 0.05 (two-sided), power = 80%** → z_{1-α/2}=1.96, z_{1-β}=0.84

n = (1.96·√(2·0.0352·0.9648) + 0.84·√(0.032·0.968 + 0.0384·0.9616))² / (0.0064)²
 = (1.96·0.2606 + 0.84·0.2606)² / 0.00004096
 = (0.5108 + 0.2189)² / 0.00004096 = 0.5325 / 0.00004096
 **≈ 13,000 visitors/arm** (26,000 total)

**Traffic:** 9,000/wk → 50/50 split = 4,500/arm/wk → 13,000 ÷ 4,500 = 2.9 wks → **run 3 weeks, fixed horizon.**
**No peeking:** lock the 3-week window; one analysis at the end. No interim looks.
**Guardrails (non-inferiority, monitor don't optimize):** hero bounce rate, trial→bank-connection (Plaid) completion rate, trial→paid conversion at day 14.

## RATIONALE

- Headline: mental accounting — money removed before it enters the "spendable" mental bucket (Q4 "take the money out before I see it"; Q2 "money that isn't mine... looking like mine").
- Subhead: ambiguity aversion — the dread is not-knowing, not the amount (Q6, Q7, Q14, Q18); "never surprises you" directly negates Q15/Q1.
- CTA "My": ownership language lowers perceived commitment friction on a free, reversible action.
- Microcopy: authority/security heuristic resolves the bank-trust objection before it blocks conversion (Q12).