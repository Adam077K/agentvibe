## COPY

**Headline:** Never Be Surprised By A Tax Bill Again

**Subhead:** Keel automatically sets aside a percentage from every client payment before it hits your budget — so you always know what's yours and what's owed.

**CTA button:** Start My Free Trial

**Microcopy (under button):** No card needed — read-only, bank-level-encrypted connection.

## TEST PLAN

**Arms:** Control (existing hero) vs. Variant (hero above), 50/50 visitor-level randomization, cookie-based sticky bucketing.

**H0:** p_variant = p_control (trial-start rate identical)
**H1:** p_variant ≠ p_control (two-sided)

**Primary metric:** trial starts ÷ unique landing-page visitors (one conversion counted per visitor).

**Baseline:** p1 = 3.2% (0.032)
**MDE:** +20% relative, +0.64pp absolute (smallest lift worth the dev/test cost) → p2 = 3.84% (0.0384)
**α** = 0.05 (two-sided), **power** = 80% → z₁₋α/2 = 1.96, z₁₋β = 0.84

**Sample size (per arm):**
p̄ = (0.032+0.0384)/2 = 0.0352
n = (1.96·√(2·0.0352·0.9648) + 0.84·√(0.032·0.968 + 0.0384·0.9616))² / (0.0384−0.032)²
n = (1.96·0.2606 + 0.84·0.2606)² / 0.00004096
n = (0.5108 + 0.2193)² / 0.00004096 = 0.5331 / 0.00004096
**n ≈ 13,020 per arm** (≈26,040 total)

**Duration:** 9,000 visitors/week ÷ 2 arms = 4,500/arm/week → 13,020 / 4,500 ≈ 2.9 weeks → **run 3 full weeks, fixed horizon, no interim peeking/stopping** (if interim looks are required, use a pre-registered alpha-spending method, e.g. O'Brien-Fleming — not naive peeking).

**Guardrails:** Day-14 trial→paid conversion (must not drop — new framing could attract lower-intent clicks); bounce rate/time-on-page; support tickets tagged "does this file taxes" (watch for Q16-style scope confusion drift); blended CAC per trial start (paid+organic mix). Check sample-ratio-mismatch weekly as a QA guard, not a stopping rule.

**Feasibility:** 3 weeks is well within the practical window — no MDE compromise needed.

## RATIONALE

Headline exploits ambiguity aversion: the dread is not-knowing, not the amount (Q6, Q18, Q7, Q14) — reframes control's generic "smart savings" into the customer's own complaint. Subhead uses mental accounting ("money that isn't mine yet," Q2, Q3) plus default/pre-commitment bias — automation acting before the user sees the money satisfies the anti-effort demand (Q4, Q10, Q19, Q17). CTA keeps the same action as control (isolates the headline/subhead as the tested variable) while first-person phrasing and "no card" reduce status-quo friction. Microcopy handles the live trust objection at the exact decision point (Q12) — loss aversion around bank access peaks right before clicking, and concrete reassurance ("read-only," "bank-level encrypted") lowers perceived risk without adding steps.