## COPY

**Headlines (5, ≤30 chars):**
1. Estimated Tax, Automated (24)
2. No More Tax Surprises (21)
3. Quarterly Tax Calculator (24)
4. Set Aside Tax, Automatically (28)
5. Cheaper Than the Penalty (24)

**Descriptions (2, ≤90 chars):**
1. Keel sets aside your tax money automatically, before you ever see it. Bank-secure. (82)
2. No dashboards to check. Know your tax number every quarter. 14-day free trial, no card. (87)

## TEST PLAN

**Design:** New RSA ("Challenger") vs. current control RSA, same ad group, ad rotation set to "Do not optimize: rotate evenly" (required — Google's default rotation would bias traffic before significance). 50/50 split.

**Primary metric: CTR (clicks ÷ impressions).**
Reasoning: ad copy's direct lever is the click decision. It's the only funnel stage with enough weekly volume (40,000 impressions) to reach adequate power within a reasonable horizon — see feasibility check below, which rules out trial-start rate or overall conversion as primary.

- H0: CTR_challenger − CTR_control = 0. H1: ≠ 0 (two-sided).
- Baseline p1 = 4.1%. MDE = 10% relative (0.41pp absolute) → p2 = 4.51%. (No MDE given; 10% relative is the smallest lift worth a copy change at this spend level — stated assumption.)
- α = 0.05 (two-sided), power = 80% (β = 0.20). z=1.96, z=0.8416.
- pbar = 0.04305; sqrt(2·pbar·(1−pbar)) = 0.2871 → term1 = 1.96×0.2871 = 0.5627
- sqrt(p1(1−p1)+p2(1−p2)) = 0.2870 → term2 = 0.8416×0.2870 = 0.2415
- n = (0.5627+0.2415)² / (0.0041)² = 0.6468 / 0.00001681 ≈ **38,500 per arm**
- Traffic: 20,000 impressions/arm/week → 38,500/20,000 = 1.93 weeks → **fixed horizon: 2 weeks**, single look at day 14, no interim peeking.

**Guardrails (directional, not powered — see below):**
- Trial-start rate (trials ÷ clicks), baseline 3.0%: must not drop >15% relative vs. control.
- Overall conversion (trials ÷ impressions), baseline 0.123%.
- CPC/spend parity between arms (rules out bid-driven confound).

**Why guardrails aren't primary — feasibility check:**
- Trial-start rate: detecting a 15% relative lift (p1=3.0%→p2=3.45%) needs ≈24,163 clicks/arm. At ~820 clicks/arm/week (4.1% of 20,000), that's **~30 weeks** — infeasible. Within an 8-week cap, only a ~29% relative lift would be detectable.
- Overall conversion (0.123% baseline): a 15% relative MDE needs ≈608,000 impressions/arm ≈ **30 weeks** — infeasible.

**Honest call:** run the 2-week CTR test now. Do not ship on CTR alone if the guardrail trial-start rate visibly (even if not significantly) degrades — hold and run a pooled, multi-cluster follow-up test to accumulate enough clicks to power the trial-start-rate check before full rollout.

## RATIONALE

- H2 "No More Tax Surprises": dread of not-knowing (Q6, Q18) — loss/ambiguity aversion.
- H1/H4 automation framing: pre-commitment device that removes willpower (Q2, Q3, Q4 — "money that isn't mine," "take it out before I see it").
- H3 "Quarterly Tax Calculator": exact keyword-intent match for the search cluster — message-match mechanism, drives Quality Score/CTR.
- H5 "Cheaper Than the Penalty": anchors price against the penalty, not competitors (Q11, Q20).
- D1 "Bank-secure": pre-empts the Plaid trust objection (Q12) at point of consideration.
- D2 "14-day free trial, no card": removes commitment friction (endowment/loss aversion around signing up).