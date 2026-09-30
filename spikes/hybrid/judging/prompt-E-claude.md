You are an expert, strict grader of conversion copy and A/B test plans. You are grading anonymous work
from several writers. You do not know who wrote which item; do not try to guess. Grade only what is on the page.

## The product and the customer corpus (all writers had exactly this)
# Customer-language corpus — "Keel" (fictional)

**Product:** Keel — a money app for US freelancers (designers, developers, writers, consultants; mostly 1099,
$40k–$180k/yr). When a client payment lands in the connected bank account, Keel automatically moves a
calculated percentage into a separate "tax pot", keeps a running estimate of what is owed, and reminds the user
before each quarterly estimated-tax deadline (Apr 15, Jun 15, Sep 15, Jan 15). $12/month or $108/year.
14-day free trial, no card required to start. Bank connection via Plaid. Does NOT file taxes.

Sources: 9 user interviews (INT), 6 support tickets (SUP), 5 app-store / G2-style reviews (REV). Collected
by the venture; quotes lightly trimmed, never reworded.

| # | Src | Segment | Quote |
|---|-----|---------|-------|
| Q1 | INT | designer, yr 2 | "The first April I owed $11,400 and I had maybe four grand. I literally didn't know you were supposed to pay during the year." |
| Q2 | INT | developer, yr 4 | "I'm not bad with money. I'm bad with money that isn't mine yet but is sitting in my account looking like mine." |
| Q3 | INT | copywriter, yr 1 | "Every time a client pays I do this little mental math of 'ok, 30% of that isn't real' and then I forget and buy a flight." |
| Q4 | SUP | consultant | "I don't need another dashboard. I need someone to just take the money out before I see it." |
| Q5 | REV | illustrator | "It's the first finance app that doesn't make me feel stupid. It just moves the money and tells me I'm fine." |
| Q6 | INT | UX designer, yr 3 | "Quarterlies are the thing I dread. Not the amount — the not knowing what the amount is." |
| Q7 | INT | developer, yr 1 | "My accountant told me a number in January. I had no idea if that number was still right in June." |
| Q8 | SUP | writer | "Can it handle when a client pays me in two chunks? My income is lumpy, like really lumpy." |
| Q9 | REV | photographer | "Tax season used to be a panic attack. This year it was a Tuesday." |
| Q10 | INT | marketer, yr 2 | "I tried a spreadsheet. I kept it up for exactly one quarter." |
| Q11 | INT | motion designer, yr 5 | "I got hit with an underpayment penalty and nobody had even told me that was a thing." |
| Q12 | SUP | developer | "Is my bank login safe? I'm nervous about giving an app access to my checking account." |
| Q13 | REV | brand designer | "I stopped checking my balance with one eye closed." |
| Q14 | INT | consultant, yr 6 | "I make good money. I just never know how much of it I actually made." |
| Q15 | INT | writer, yr 1 | "I went freelance in March and nobody hands you a manual. You just find out in April." |
| Q16 | SUP | designer | "Does it file my taxes? Because honestly I'd pay for that too." |
| Q17 | REV | developer | "Set it up in ten minutes, forgot about it, and in September the money was just… there." |
| Q18 | INT | illustrator, yr 3 | "It's not the tax, it's the surprise. I can budget for anything I can see coming." |
| Q19 | INT | video editor, yr 2 | "I've paid for three budgeting apps. I stopped opening all three." |
| Q20 | SUP | consultant | "Twelve bucks a month is nothing compared to the penalty I paid last year." |

## Observed patterns (venture's own notes — hypotheses, not proven)

- Dominant pain is **surprise / not-knowing**, not the tax amount (Q6, Q7, Q14, Q18).
- Strong "**money that isn't mine**" framing (Q2, Q3).
- Anti-dashboard, anti-effort: they want it done **before they see it** (Q4, Q10, Q19).
- Trust objection on **bank connection** (Q12); scope confusion — thinks it files taxes (Q16).
- Price is justified against the **penalty**, not against other apps (Q20, Q11).


## Rubric
# Grading rubric (pre-registered)

Score every item on four dimensions, integers 1–10. Grade each item on its own merits against the anchors,
then check your scores are consistent across the items of the same task.

**D1 — Customer-language fidelity.** Does the copy speak in the customers' own words and pains as shown in
the corpus (e.g. the surprise / not-knowing, "money that isn't mine", "take it out before I see it", bank-login
trust, the penalty, lumpy income) — without inventing pains the corpus does not show?
1–3: generic category language ("smart", "automate", "effortless") that ignores the corpus. 4–6: gestures at
real pains in marketer paraphrase. 7–8: clearly built on the corpus's dominant pains, some real phrasing.
9–10: a customer from the corpus would read it and think "that's exactly me"; phrasing is theirs, nothing invented.

**D2 — Specificity.** Concrete, non-interchangeable. 1–3: could be pasted onto any fintech. 4–6: product-specific
but vague on outcome/mechanism. 7–8: concrete outcome, mechanism, and next step. 9–10: vivid, precise, every
element does one job, respects all stated length limits (a limit violation caps D2 at 5).

**D3 — Statistical correctness of the test plan.** Use `stats-reference.md` as the answer key.
1–3: no sample-size reasoning, "run until significant", or a duration impossible for the stated traffic.
4–6: states an MDE or a duration, but n is wrong by > 30%, or relative/absolute lift confused, or peeking allowed,
or (T4) claims a normal short test. 7–8: MDE, alpha, power stated; n within ~15% of the key; duration derived from
traffic in whole weeks; primary metric and denominator named. 9–10: all of that plus fixed horizon / no peeking
(or a valid sequential method), guardrail metrics, and honest handling of feasibility (T4: says plainly it is
underpowered and gives a sound alternative; T5: names the CTR-vs-downstream trade-off).

**D4 — Likely conversion.** Your forecast of how this copy would perform against the stated control and against
the other items for the same task in a real test with this audience. 1–3: likely loses to the control.
4–6: roughly control-level. 7–8: likely clear winner over control. 9–10: best-in-set; you would ship it.


## Statistical answer key (for D3)
# Statistical reference (alpha=0.05 two-sided, power=0.80, 50/50 split)

Cells: n per arm / weeks to reach it (total units = 2n, divided by weekly volume).

| Task | baseline | units/wk | MDE +5% rel | MDE +10% rel | MDE +15% rel | MDE +20% rel | MDE +30% rel | MDE +50% rel |
|---|---|---|---|---|---|---|---|---|
| T1 landing trial-start | 3.200% | 9000 visitors | 194,530 / 43.2 wk | 49,777 / 11.1 wk | 22,631 / 5.0 wk | 13,015 / 2.9 wk | 6,037 / 1.3 wk | 2,354 / 0.5 wk |
| T2 pricing trial-start | 6.000% | 2400 visits | 100,670 / 83.9 wk | 25,740 / 21.4 wk | 11,693 / 9.7 wk | 6,719 / 5.6 wk | 3,112 / 2.6 wk | 1,209 / 1.0 wk |
| T3 email -> bank connect | 41.000% | 990 recipients | 9,100 / 18.4 wk | 2,289 / 4.6 wk | 1,022 / 2.1 wk | 577 / 1.2 wk | 258 / 0.5 wk | 93 / 0.2 wk |
| T4 cancel-save rate | 12.000% | 69 cancel attempts | 47,036 / 1362.5 wk | 12,004 / 347.7 wk | 5,443 / 157.7 wk | 3,122 / 90.4 wk | 1,440 / 41.7 wk | 555 / 16.1 wk |
| T5a ad CTR (per impression) | 4.100% | 40000 impressions | 150,380 / 7.5 wk | 38,470 / 1.9 wk | 17,486 / 0.9 wk | 10,053 / 0.5 wk | 4,661 / 0.2 wk | 1,816 / 0.1 wk |
| T5b ad trial/impression | 0.123% | 40000 impressions | 5,225,988 / 261.3 wk | 1,338,321 / 66.9 wk | 608,952 / 30.4 wk | 350,491 / 17.5 wk | 162,844 / 8.1 wk | 63,713 / 3.2 wk |

Notes for graders:
- A plan is statistically CORRECT if its n is within ~15% of this table for the MDE it chose (other valid formulas/one-sided choices shift n modestly; a stated one-sided test is acceptable if declared).
- T4 is the trap: ~69 attempts/week. Even a +50% relative lift (12%->18%) needs ~555/arm, i.e. ~16 weeks. An honest plan says the test is underpowered for realistic lifts and proposes an alternative. Claiming a normal 2-4 week test is a statistical error.
- T5: a CTR-primary test is feasible in weeks; a trial-per-impression primary needs very large samples. Either is acceptable if sized correctly and the trade-off (CTR is a proxy; ad copy can raise CTR while lowering downstream conversion) is named.
- Penalise: no MDE stated, n with no reasoning, peeking/"run until significant", duration not derived from traffic, ignoring weekly cycles (<1 full week), confusing relative and absolute lift.



## Items to grade (28 items, grouped by task)


# TASK T1

**Brief given to every writer:** Write the landing-page HERO for Keel: one headline (max 10 words), one subhead (max 30 words), one primary CTA button label (max 5 words) and one line of microcopy under the button. Then write an A/B test plan: your hero (variant) vs the current control hero 'Smart tax savings for freelancers' / 'Automate your estimated taxes with Keel.' / 'Start free trial'. Traffic: 9,000 unique visitors/week to the landing page (paid + organic, stable). Baseline: 3.2% of unique visitors start a trial.


----- ITEM I5950 (task T1) -----

## COPY

**Headline:** Taxes you can see coming.

**Subhead:** Keel automatically moves a calculated share of each client payment into a separate tax pot and keeps a running estimate of what you owe.

**CTA:** Start my free trial

**Microcopy:** 14 days free. No card required. Bank connection via Plaid. Plans: $12/month or $108/year. Does not file taxes.

## TEST PLAN

- **Design:** Randomize unique visitors 50/50 between the supplied control and this complete hero, including microcopy. Persist assignment across visits; change nothing else. Assume 9,000 newly eligible unique visitors weekly and a baseline measured over the conversion window below.
- **Primary metric:** Unique visitors starting a trial within seven days of assignment ÷ all unique visitors assigned to that arm.
- **Hypotheses:** H₀: p_variant = p_control. H₁: p_variant ≠ p_control.
- **Pre-chosen MDE:** **25% relative lift**, from **3.2% to 4.0%**: **+0.8 percentage points** absolute. Two-sided α = 0.05; power = 80%.

**Sample size per arm:**

With p₁ = 0.032, p₂ = 0.040, p̄ = 0.036, z₁₋α/₂ = 1.96 and z₁₋β = 0.8416:

\[
n=\frac{\left[1.96\sqrt{2(0.036)(0.964)}
+0.8416\sqrt{(0.032)(0.968)+(0.040)(0.960)}\right]^2}
{(0.040-0.032)^2}
\approx 8{,}512
\]

- **Fixed horizon:** 17,024 required visitors ÷ 9,000/week = 1.89 weeks, rounded up to **two weeks of enrollment**. Expect 9,000 visitors per arm. Allow seven additional days for outcomes to mature; analyze on **day 21**. No peeking at conversion results, early stopping or outcome-driven extensions.
- **Decision:** Declare a conversion win only for a positive difference with two-sided p < 0.05. Report absolute and relative lift with 95% confidence intervals. An inconclusive result does not establish equivalence.
- **Guardrails:** Seven-day bank connections per randomized visitor; bank-connection failures per attempted connection; security or filing-confusion support contacts per trial starter; page-load performance. Review adverse movement before rollout. These are diagnostic checks, not powered proof of safety.


----- ITEM I2089 (task T1) -----

## COPY

**Headline:** Stop guessing what to set aside for taxes.

**Subhead:** When a client payment lands, Keel automatically moves a calculated percentage into a separate tax pot, keeps your tax estimate updated, and reminds you before quarterly deadlines.

**Primary CTA:** Start your 14-day free trial

**Microcopy:** No card required. After trial: $12/month or $108/year. Bank connection via Plaid. Keel doesn’t file taxes.

## TEST PLAN

- **Control:** “Smart tax savings for freelancers” / “Automate your estimated taxes with Keel.” / “Start free trial”. Keep existing microcopy unchanged.
- **Variant:** All copy above. This tests the complete hero; results won’t isolate individual elements.
- **Allocation:** Randomly split unique visitors 50/50, keeping returning visitors in their assigned version. Keep layout, acquisition campaigns, and signup flow consistent.
- **Primary metric:** Percentage of assigned unique visitors who start a trial within seven days of first exposure. Assume the 3.2% baseline uses this window.
- **Target:** Detect a 20% relative lift—from 3.2% to 3.84%, or +0.64 percentage points—with 80% power and a two-sided 5% significance level. Requires approximately 13,000 visitors per arm.
- **Duration:** Enroll for three full weeks: approximately 27,000 visitors, 13,500 per arm. Wait seven additional days for conversions to mature. Don’t stop early based on significance.
- **Decision:** Adopt the variant if its conversion lift is positive and statistically significant. Otherwise, report the confidence interval and call the result inconclusive unless it establishes a decline.


----- ITEM I3957 (task T1) -----

## COPY

**Headline:** Stop guessing what to set aside for taxes.

**Subhead:** Keel automatically moves a calculated percentage of each client payment into a separate tax pot, keeps your tax estimate updated, and reminds you before quarterly deadlines.

**Primary CTA:** Start my 14-day free trial

**Microcopy:** No card required. Then $12/month or $108/year. Connect your bank via Plaid. Keel doesn’t file taxes.

## TEST PLAN

- **Design:** Randomize unique visitors 50:50, with persistent assignment. Control uses the supplied hero; variant uses the complete COPY above. Keep acquisition, layout, and everything outside the hero unchanged. This tests the hero package.
- **Primary metric:** Unique visitors starting a trial within seven days of assignment ÷ all unique visitors assigned to that arm. Assume the 3.2% baseline uses this definition; verify before launch.
- **Hypotheses:** H0: \(p_V=p_C\). H1: \(p_V\ne p_C\).
- **Pre-chosen MDE:** 20% relative uplift: 3.2% → 3.84%, an absolute increase of **0.64 percentage points**. This is a planning threshold, not a predicted lift.
- **Significance / power:** Two-sided α = 0.05; power = 80%.

**Per-arm sample calculation:**

\[
\bar p=(0.032+0.0384)/2=0.0352
\]

\[
n=
\frac{\left[
1.96\sqrt{2(0.0352)(0.9648)}
+0.8416\sqrt{0.032(0.968)+0.0384(0.9616)}
\right]^2}{(0.0384-0.032)^2}
\]

\[
n\approx\frac{(0.510812+0.219303)^2}{0.00004096}
=13{,}014.4
\Rightarrow \mathbf{13{,}015\ per\ arm}.
\]

- **Fixed horizon:** \(26{,}030/9{,}000=2.89\) weeks; round up to **three enrollment weeks**, yielding approximately 13,500 visitors per arm. Allow seven additional days for outcomes: **four calendar weeks** total. No interim significance checks, early success stops, or extensions based on results.
- **Guardrails:** Bank connections within seven days of assignment ÷ assigned visitors; bank-link failures ÷ connection attempts; bank-trust or filing-confusion support contacts ÷ trial starters. Review operational safety throughout; evaluate comparative outcomes at the fixed horizon.
- **Decision:** Report absolute uplift, relative uplift, and a 95% confidence interval. Ship on statistically significant improvement with acceptable guardrails. An inconclusive result does not establish equivalence.


----- ITEM I7256 (task T1) -----

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


----- ITEM I6761 (task T1) -----

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


----- ITEM I3817 (task T1) -----

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

**Guardrails:** Day-14 trial→paid conversion (must not drop — new framing could attract lower-intent clicks); bounce rate/time-on-page; support tickets tagged "does this file taxes" (watch for -style scope confusion drift); blended CAC per trial start (paid+organic mix). Check sample-ratio-mismatch weekly as a QA guard, not a stopping rule.

**Feasibility:** 3 weeks is well within the practical window — no MDE compromise needed.


----- ITEM I3328 (task T1) -----

## COPY

**Headline:** Set aside tax money before you spend it.

**Subhead:** For freelancers: Keel automatically moves part of each client payment into a separate tax pot, tracks your estimated tax bill, and reminds you before quarterly deadlines.

**Primary CTA:** Start my free trial

**Microcopy:** 14 days free. No card required. Then $12/month or $108/year. Bank connection via Plaid. Keel does not file taxes.

## TEST PLAN

- **Control:** “Smart tax savings for freelancers” / “Automate your estimated taxes with Keel.” / “Start free trial”
- **Variant:** Complete hero above, including microcopy. Keep layout, traffic campaigns, and the rest of the page unchanged.
- **Hypothesis:** A concrete benefit and clear expectations will generate more trial starts than general “smart” automation messaging.
- **Allocation:** Randomly assign unique visitors 50/50; keep each visitor’s assignment consistent across visits.
- **Primary metric:** Percentage of assigned unique visitors starting a trial within seven days of first exposure. Assume the 3.2% baseline uses this window.
- **Sample and duration:** Target a 20% relative lift—from 3.2% to 3.84%, or +0.64 percentage points. At 80% power and 5% two-sided significance, approximately 26,000 visitors are needed. Run enrollment for three full weeks: 27,000 visitors, approximately 13,500 per arm. Allow seven additional days for conversions to mature.
- **Decision:** Analyze once after completion. Adopt the variant if the conversion difference is positive and its 95% confidence interval excludes zero. Otherwise retain control; an inconclusive result does not establish equivalence.


----- ITEM I9774 (task T1) -----

## COPY

**Headline:** Your tax money, moved before you spend it.

**Subhead:** Keel sets aside the right percentage the moment a client pays you, tracks exactly what you owe, and reminds you before every quarterly deadline.

**Primary CTA:** Start My Free Trial

**Microcopy:** 14 days free, no card required. Bank-grade security via Plaid.

## TEST PLAN

**Control:** "Smart tax savings for freelancers" / "Automate your estimated taxes with Keel." / "Start free trial"
**Variant:** Copy above (surprise-prevention + "money moves before you see it" framing)

**Metric:** Primary — trial-start rate (unique visitor → trial started). Secondary (guardrail) — trial-to-paid conversion at day 14, to confirm the variant isn't just attracting curious clicks that don't convert.

**Split:** 50/50, randomized at first page load, sticky per visitor.

**Sample size:** To detect a 20% relative lift (3.2% → 3.84%, +0.64pp) at 95% confidence / 80% power: ~13,000 visitors per arm (~26,000 total).

**Duration:** At 9,000 visitors/week (4,500/arm), that's ~3 weeks. Run a minimum of 3 full weeks regardless of early significance, to cover weekday/weekend and paid/organic mix variance. If not significant at 3 weeks, extend to 4.

**Stop/ship rule:** Ship variant if trial-start rate is significantly higher AND day-14 paid-conversion is not significantly lower (no quality degradation).


# TASK T2

**Brief given to every writer:** Write the PRICING PAGE top section for Keel: a headline (max 10 words), a one-sentence value line under it, and the copy for the single plan card (plan name, 3 bullet benefits max 10 words each, CTA label). Then write an A/B test plan for this change: control shows monthly price ($12/mo) by default; variant shows the annual price by default ($108/yr, framed however you choose) with a toggle to monthly. Traffic: 2,400 pricing-page visits/week. Baseline: 6.0% of pricing-page visits start a trial.


----- ITEM I3390 (task T2) -----

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


----- ITEM I2555 (task T2) -----

## COPY

**Headline:** Set tax money aside before you spend it.

**Value line:** Keel automatically moves a calculated share of each client payment into a separate tax pot, so you can prepare as you earn.

**Plan name:** Keel

**Monthly price:** $12/month, billed monthly.

**Annual price:** $108/year, billed annually. Equivalent to $9/month—save 25% compared with monthly billing.

**Billing toggle:** Monthly | Annual

**Benefits:**

- Tax money set aside automatically as clients pay.
- A running estimate of what you owe.
- Reminders before each quarterly estimated-tax deadline.

**CTA:** Start my 14-day free trial

**Reassurance beneath CTA:** No card required to start. Bank connection via Plaid. Keel doesn’t file taxes.

## TEST PLAN

**Hypothesis:** Showing the annual plan’s lower equivalent monthly cost first increases trial starts by making ongoing value clearer.

**Control:** Monthly selected by default; $12/month prominent. Toggle to annual.

**Variant:** Annual selected by default; $108/year prominent, with annual billing, $9/month equivalent, and 25% savings clearly stated. Toggle to monthly.

Keep all other copy, layout, and checkout behavior identical. Each billing option displays the same information in both arms.

**Allocation:** Randomize eligible visitors 50/50 and persist their assignment.

**Primary metric:** Trial starts ÷ eligible pricing-page visits.

**Sample and duration:** Assume visits approximate independent visitors, stable traffic, and a 20% relative minimum detectable lift: 6.0% → 7.2%. At 80% power and two-sided 5% significance, target approximately 6,700 visits per arm. Run **six full weeks**, yielding approximately 7,200 per arm at current traffic. Extend if needed to reach the sample target; don’t stop early for significance.

**Quality checks:** Track bank-connection completion and paid conversion per pricing-page visitor. Allow every trial cohort at least 14 days to mature before deciding.

**Decision:** Adopt annual default if trial-start lift is statistically significant and downstream results support it. Investigate weaker activation or paid conversion before rollout; otherwise retain monthly default.


----- ITEM I5580 (task T2) -----

## COPY

**Headline:** Budget for taxes you can see coming.

**Value line:** Keel automatically moves a calculated share of each client payment into a separate tax pot and keeps a running estimate of what you owe.

**Plan name:** Keel Automatic

**Billing toggle:** Annual · Monthly — Annual selected

**Price:** $108/year, billed annually

**Price framing:** Equivalent to $9/month. Save $36/year versus monthly.

**Monthly option:** $12/month

**Benefits:**

- Automatically set aside tax money when clients pay.
- See a running estimate of what you owe.
- Get reminders before quarterly estimated-tax deadlines.

**CTA:** Start my 14-day free trial

**CTA reassurance:** No card required to start. Automatic transfers require a bank connection via Plaid. Keel doesn’t file taxes.

## TEST PLAN

**Design:** Randomize eligible visitors 50/50; persist assignment across return visits. Control defaults to $12/month; variant defaults to $108/year with the framing above. Both offer the same billing toggle. Keep all other copy, layout and acquisition sources identical. This isolates the default billing presentation; it does not test the new copy against existing copy.

**Assumptions:** The 2,400 weekly visits represent distinct eligible visitors, and the 6% baseline applies to their first visits. Deduplicate repeat visits; if eligible traffic is lower, recalculate duration before launch.

**Primary metric:** Visitors starting a trial within seven days of their first eligible pricing-page visit ÷ all randomized eligible visitors. Count each visitor once, regardless of toggle use.

**Hypotheses:** H₀: annual-default and monthly-default trial-start rates are equal. H₁: they differ. Use a two-sided test; a decline remains possible.

**Pre-chosen MDE:** 20% relative lift; **1.2 percentage points absolute**, from 6.0% to 7.2%. α = 0.05; power = 80%.

**Sample size:** With p₁ = 0.060, p₂ = 0.072, p̄ = 0.066, z₁₋α/₂ = 1.960 and z₁₋β = 0.842:

\[
n=\frac{\left[1.960\sqrt{2(0.066)(0.934)}
+0.842\sqrt{(0.060)(0.940)+(0.072)(0.928)}\right]^2}
{(0.072-0.060)^2}
\approx 6{,}721\text{ visitors/arm}.
\]

**Fixed horizon:** 1,200 visitors/arm/week gives 6,721 ÷ 1,200 = 5.60 weeks. Run **six full weeks**, expecting 7,200/arm, then allow seven days for conversions to mature. Analyze once at the end of week seven. No significance peeking, early stopping or outcome-driven extensions.

**Guardrails:** Bank-link completion per trial; trial-to-paid conversion; 60-day net revenue per randomized visitor; cancellation/refund rate among purchasers.

**Decision:** Declare a trial-start win only with a positive effect and two-sided p < 0.05; report the absolute lift and 95% confidence interval. A nonsignificant result is inconclusive. Review mature paid outcomes before permanent rollout: more trials alone cannot establish better economics. This horizon supports the chosen MDE, not reliably smaller effects.


----- ITEM I8726 (task T2) -----

## COPY

**Headline:** Stop Guessing What You Owe The IRS

**Value line:** Keel sets your tax money aside the moment it lands, so quarterly deadlines stop being a surprise.

**Plan card**
- **Plan name:** Keel
- **Benefit 1:** Moves tax money out before you see it
- **Benefit 2:** Always shows exactly what you owe
- **Benefit 3:** Handles lumpy income — one payment or ten
- **CTA:** Start Free Trial — No Card Needed

## TEST PLAN

**Change:** Control defaults to $12/mo billed monthly. Variant defaults to annual, framed as "$9/mo, billed $108/yr" with a visible toggle to switch to $12/mo monthly. Assumption: framing as a monthly-equivalent number reduces sticker shock of the $108 lump sum while still capturing the annual commitment.

**Hypotheses:** H0: trial-start rate(variant) = trial-start rate(control). H1: rates differ (two-sided — annual-default could help via lower perceived monthly cost, or hurt via upfront-commitment friction).

**Primary metric:** Trial starts ÷ unique pricing-page visits (same definition as the 6.0% baseline).

**Design parameters:** MDE = +1.0pp absolute (6.0%→7.0%, +16.7% relative) — smallest lift worth shipping for. α=0.05 two-sided (z=1.96), power=80% (z=0.84).

**Sample size:**
p̄=0.065 → 2p̄(1−p̄)=0.1216, √=0.3486
p1(1−p1)+p2(1−p2)=0.0564+0.0651=0.1215, √=0.3486
Numerator = (1.96×0.3486 + 0.84×0.3486)² = (0.9767)² = 0.9539
n = 0.9539 / (0.01)² = **9,540 visits/arm** (≈19,080 total)

**Duration:** 2,400 visits/wk → 1,200/arm/wk → 19,080 ÷ 2,400 = 7.95 wks → **8 weeks**. This sits right at the acceptable ceiling — tight but workable. If traffic drops, widen MDE to 1.5pp (n≈4,260/arm, ~4 weeks) rather than extend past 8 weeks.

**Protocol:** 50/50 visitor-level randomization, persistent bucketing. Fixed 8-week horizon, single analysis at the end — no interim peeking. If early monitoring is required, use an O'Brien-Fleming spending function with ≤2 interim looks instead of naive peeking.

**Guardrails:** trial→paid conversion rate (Day 7), 30-day refund/cancellation rate, revenue per visitor, support tickets tagged "billing confusion."


# TASK T3

**Brief given to every writer:** Write the DAY-2 ACTIVATION EMAIL for trial users who signed up but have NOT connected a bank account (without a connected bank Keel does nothing). Provide 2 subject-line options (max 8 words each), a preheader, and a body of max 120 words with one CTA. Then write an A/B test plan: your email vs the current control email (subject 'Finish setting up Keel', generic 'connect your bank to get started' body). Volume: 1,800 new trial signups/week, of whom about 55% have not connected a bank by day 2 and will receive this email. Baseline: 41% of email recipients connect a bank within 7 days of the email.


----- ITEM I1080 (task T3) -----

## COPY

**Subject A:** Your tax pot isn't filling yet
**Subject B:** Bank link: encrypted, read-only, 2 minutes

**Preheader:** No dashboard to check — Keel sets the money aside before you ever see it.

**Body (CTA: "Connect your bank — 2 min →"):**

Hi [First name],

Two days in, but nothing's moved yet — without a connected bank, Keel can't set anything aside for taxes.

We get the hesitation: handing over bank access feels risky. Here's the actual setup — Plaid's bank-grade encryption, read-only access, no ability to move money anywhere but your own tax pot. Nobody at Keel ever sees your login.

It takes two minutes. After that, every client payment gets its tax cut set aside automatically — no dashboard to check, no spreadsheet to maintain. Just money already accounted for by the time April rolls around.

[Connect your bank — 2 min →]

*(Assumption: Subject A ships as the tested variant; Subject B is held for a follow-up subject-line test once the body-copy winner is confirmed, so this stays a clean 2-arm test.)*

## TEST PLAN

**Design:** Variant (Subject A + new body) vs. Control ("Finish setting up Keel" / generic body). Random 50/50 assignment at the moment a trial user hits day-2-no-bank status.

**H0:** p_variant = p_control = 0.41 (7-day bank-connect rate). **H1:** p_variant ≠ p_control (two-sided).

**Primary metric:** % of email recipients who connect a bank within 7 days of receipt. Denominator = recipients in each arm (day-2 non-connectors who got the email).

**MDE:** +10% relative (0.41 → 0.451), i.e. +4.1pp absolute — smallest lift worth the calendar cost of testing.

**α = 0.05 (two-sided), power = 80%.** z₁₋α/₂=1.96, z₁₋β=0.8416.

p̄=0.4305 → 2p̄(1−p̄)=0.4903 → √=0.7002 → 1.96×0.7002=1.3724
p1(1−p1)=0.2419, p2(1−p2)=0.2476 → sum=0.4895 → √=0.6996 → 0.8416×0.6996=0.5888
Sum²=(1.3724+0.5888)²=1.9612²=3.846
n = 3.846 / (0.041)² = 3.846 / 0.001681 ≈ **2,289 per arm** (4,578 total).

**Traffic:** 1,800 signups/wk × 55% non-connected = 990 eligible/wk → 495/arm/wk.
**Duration:** 2,289 / 495 = 4.6 → **5 weeks**, fixed horizon, single analysis at the end. No interim peeking; if a stakeholder needs interim looks, use O'Brien-Fleming spending, not naive repeated testing.

**Guardrails (non-inferiority, monitor don't optimize):** 14-day trial→paid conversion, unsubscribe/spam-complaint rate, support tickets tagged "bank/security" (watch for the security explanation triggering more anxiety, not less).

Feasible: 5 weeks is well under the 8-week ceiling — run as specified.


----- ITEM I7973 (task T3) -----

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


----- ITEM I6257 (task T3) -----

## COPY

**Subject option 1:** It’s not the tax. It’s the surprise.

**Subject option 2:** Move tax money before you see it

**Preheader:** Less mental math. Tax money set aside automatically.

**Body:**

Not knowing what you’ll owe is the hard part.

You haven’t connected a bank yet, so Keel isn’t setting money aside.

Connect your bank and Keel will automatically move a calculated percentage of incoming client payments into a separate tax pot, keep a running estimate of what you owe, and remind you before quarterly deadlines.

Less mental math every time a client pays. Less wondering whether your estimate is still right.

Bank connection is through Plaid. Keel doesn’t file your taxes. Your 14-day trial requires no card.

**CTA:** Connect my bank

## TEST PLAN

- **Design:** Randomize eligible day-2 users 1:1 between the current control and this email using **subject option 1**. Option 2 remains untested. Hold sender, timing, destination, and subsequent messaging constant. Test the complete email package.
- **Eligibility:** Still unconnected immediately before sending; one assignment per user. Assume steady traffic and a baseline applicable to this population.
- **Primary metric:** Users successfully connecting a bank within seven days ÷ all eligible randomized recipients, including those who never open or click.
- **Hypotheses:** H0: \(p_T=p_C\). H1: \(p_T\ne p_C\).
- **Preselected MDE:** **15% relative**, or **6.15 percentage points absolute**: 41% → 47.15%. Two-sided α = .05; power = 80%.

**Sample size per arm:**

\[
\bar p=(.41+.4715)/2=.44075
\]

\[
n=\frac{\left(1.96\sqrt{2(.44075)(.55925)}
+.8416\sqrt{(.41)(.59)+(.4715)(.5285)}\right)^2}
{(.4715-.41)^2}
\]

\[
n\approx\frac{3.86491}{.00378225}=1{,}021.86
\Rightarrow \mathbf{1{,}022\ per\ arm}
\]

**Fixed horizon:** \(1,800 \times .55=990\) recipients/week; 495/arm/week. Enrollment requires \(1,022/495=2.06\) weeks, rounded up to **three full weeks**, yielding approximately 1,485/arm. Wait seven additional days for outcomes: **four weeks total**. Adequately powered within eight weeks.

**Decision:** Analyze once after the fixed horizon; no interim efficacy checks or significance-based extensions. Report absolute lift, relative lift, and a 95% confidence interval. Ship if the two-sided test is significant, lift is positive, and guardrails pass; otherwise call the result inconclusive or harmful as appropriate.

**Guardrails:** Unsubscribes/recipients, spam complaints/recipients, and failed bank connections/connection attempts. Assumed operational tolerances: treatment increases below 0.5, 0.1, and 2 percentage points, respectively. These are rollout checks; rare harms may remain uncertain.


----- ITEM I9830 (task T3) -----

## COPY

**Subject A:** Nothing's happening in your Keel account
**Subject B:** One step stands between you and surprises

**Preheader:** Read-only, bank-level security via Plaid. Takes about 2 minutes — then Keel starts working.

**Body:**
Right now Keel is watching an empty account. Nothing moves, nothing gets set aside, nothing gets tracked — because it isn't connected to anything yet.

Once you link your bank, Keel does the one job that matters: pulls a percentage out before you ever see it as spendable, so quarterly deadlines stop being a guessing game.

It's read-only access through Plaid — bank-level encryption, no ability to move money anywhere Keel doesn't already tell you about.

**CTA button:** Connect Your Bank (2 min)

## TEST PLAN

- **Control:** current email — subject "Finish setting up Keel," generic "connect your bank to get started" body.
- **Variant:** copy above.
- **Metric (primary):** % of recipients who connect a bank within 7 days of email send.
- **Guardrail metrics:** unsubscribe rate, spam-complaint rate (bank-trust messaging carries some risk of feeling invasive).
- **Split:** 50/50 random assignment at send time.
- **Volume:** ~990 recipients/week (1,800 × 55%) → ~495/arm/week.
- **Sample size:** to detect a 5-point absolute lift (41% → 46%, ~12% relative) at 80% power, α=0.05 two-sided, need ≈1,540 recipients per arm.
- **Duration:** run 4 weeks (~1,980/arm) — covers the required sample with buffer and spans weekly signup-mix variation (day-of-week, campaign source).
- **Decision rule:** ship variant if it beats control on primary metric with no guardrail regression >20% relative; otherwise keep control and test a second variant isolating subject line vs. body.


# TASK T4

**Brief given to every writer:** Write the CANCELLATION-FLOW SAVE SCREEN shown when a paying Keel user clicks 'Cancel subscription': a headline, max 60 words of body, a primary 'stay' action label, a secondary action label, and the confirm-cancel label. You may include one offer if you judge it wise. Then write an A/B test plan: your save screen vs the current control (a plain 'Are you sure?' confirm dialog). Volume: about 300 cancellation attempts per MONTH. Baseline: 12% of cancellation attempts end with the user staying (not cancelling).


----- ITEM I7705 (task T4) -----

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


----- ITEM I8725 (task T4) -----

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


----- ITEM I6907 (task T4) -----

## COPY

**Headline:** Cancel now, and April goes back to guessing.

**Body (50 words):** Keel already knows what you'll owe Jan 15, and it's sitting safe in your tax pot. Cancel and that tracking stops today — you're back to mental math. Money tight? Pause for 60 days instead: your pot stays untouched, deadlines still get flagged, and you're not billed again until you resume.

**Primary (stay) CTA:** Keep my tax pot running

**Secondary CTA (offer):** Pause for 60 days

**Confirm-cancel label:** No thanks, cancel my plan

## TEST PLAN

**Design:** Two-arm, user-level randomized, 50/50. Control = current plain "Are you sure?" dialog. Treatment = save screen above. Unit of randomization: user (sticky), to avoid within-user contamination across repeat attempts.

**H0:** stay-rate(treatment) = stay-rate(control). **H1:** stay-rate(treatment) ≠ stay-rate(control) (two-sided — an offer-laden screen could also backfire, e.g. feel manipulative and depress stays).

**Primary metric:** stay rate = attempts that do NOT end in confirmed cancellation ÷ total cancellation attempts reaching the screen (matches baseline definition). Baseline p1 = 0.12.

**Alpha/power:** α = 0.05 (two-sided, z=1.96), power = 80% (z=0.8416).

**Volume reality check:** 300 attempts/month total → 150/arm/month.

- Ideal MDE (+4pp abs., 12%→16%, +33% rel.): pbar=0.14; n = (1.96·√(2·0.14·0.86) + 0.8416·√(0.12·0.88+0.16·0.84))² / 0.04² = (0.962+0.412)²/0.0016 ≈ **1,181/arm** → ~35 weeks. **Not feasible in a reasonable window — flagging this rather than pretending.**
- 8-week budget (~276/arm): only powered to detect ≥+9pp abs. (12%→21%, +75% rel.).

**Recommended compromise — 12-week fixed horizon (~415/arm, 830 total):** pre-commit MDE = **+7pp abs. (12%→19%, +58% rel.)**. Check: n=(1.96·√(2·0.155·0.845)+0.8416·√(0.12·0.88+0.19·0.81))²/0.07² = (1.003+0.429)²/0.0049 ≈ **418/arm** — matches available traffic. If the mechanism (loss-aversion reframe + concrete pause offer) can't clear a 58% relative lift in 12 weeks, ship the copy anyway on qualitative grounds (no downside risk, no dark patterns) rather than extend the test further.

**No peeking:** single pre-registered look at 12 weeks; no interim analysis (weekly volume too thin for a valid sequential design).

**Guardrails:** 30-day post-save churn of "stayed" users (net-revenue check, not just flow-exit), support tickets mentioning "can't cancel"/complaints, cancellation-flow completion time, bank-disconnect rate.


----- ITEM I5226 (task T4) -----

## COPY

**Headline:** Keep tax money out of spending money.

**Body:** Keel automatically moves a calculated share of each client payment into your tax pot and keeps a running estimate of what you owe. Less mental math. Fewer unknowns. Keeping your subscription continues your current plan and price. Keel doesn’t file taxes.

**Primary stay action:** Keep my subscription

**Secondary action:** Cancel subscription

**Confirm-cancel label:** Cancel subscription  
*The secondary action confirms cancellation directly; no additional confirmation screen.*

## TEST PLAN

**Design:** Randomize eligible paying users 50/50 at their first cancellation attempt: current “Are you sure?” dialog versus save screen. Persist assignment; count each user once. Assume 300 unique users/month and that the supplied baseline matches the measurement window below.

**Primary metric:** Users who have not cancelled within 24 hours ÷ all randomized users. Include abandoned flows in the denominator. Report explicit “keep” selections separately to distinguish deliberate saves from abandonment.

**Hypotheses:** H0: save rates are equal. H1: save rates differ. Two-sided α = 0.05; power = 80%.

**Feasibility:** Detecting 12% → 18% (+6 percentage points; +50% relative) requires approximately 555 users/arm, or **17 weeks**. That exceeds a reasonable eight-week horizon.

**Chosen alternative:** Test only for a large effect: 12% → 24%, **+12 percentage points / +100% relative**. This is a sensitivity threshold, not a forecast.

With \(p_1=.12\), \(p_2=.24\), \(\bar p=.18\), \(z_{1-\alpha/2}=1.96\), and \(z_{1-\beta}=.84\):

\[
n=\frac{\left[1.96\sqrt{2(.18)(.82)}
+.84\sqrt{(.12)(.88)+(.24)(.76)}\right]^2}{(.24-.12)^2}
\approx159.5
\]

Round up to **160 users/arm**, 320 total.

**Duration:** \(300 \times 12/52 \approx 69.2\) users/week.  
\(320/69.2=4.62\) weeks → **five full weeks**, approximately 173 users/arm.

**Pre-commitment:** Freeze copy, allocation, metric and five-week enrollment horizon before launch. No interim efficacy checks or significance-driven extensions. Analyze after the final user’s 24-hour window. Report the absolute difference, relative lift and 95% confidence interval. A nonsignificant result cannot rule out smaller useful gains.

**Guardrails:** Cancellation completion time, cancellation-related complaints, refunds/chargebacks, and 30-day paid retention across all randomized users. Review mature 30-day outcomes before rollout; an immediate save increase alone is insufficient. Keep cancellation equally visible and equally easy in both arms.


----- ITEM I7729 (task T4) -----

## COPY

**Headline:** Cancelling turns the tracking off — not the taxes.

**Body (57 words):** Right now Keel is already setting money aside for your next quarterly and tracking exactly what you owe. Cancel today and that stops immediately — no more automatic set-asides, no reminder before your next deadline. You're back to guessing until the number shows up in April. One underpayment penalty typically costs more than a full year of Keel.

**Primary ("stay") action:** Keep my tax pot running

**Secondary action (offer):** Pause instead — skip billing until my next deadline

**Confirm-cancel label:** No thanks, cancel my subscription

## TEST PLAN

**Design:** 50/50 randomization at the "Cancel subscription" click, session/account-level bucketing (sticky per user). Arm A (control): plain "Are you sure?" dialog. Arm B: save screen above.

**Hypotheses:** H0: p_B ≤ p_A (save rate of new screen no better than control). H1: p_B > p_A. One-sided, pre-registered — the only decision this test informs is "ship B or don't"; a screen that underperforms control is simply not shipped, so there's no separate action for "significantly worse," which justifies the one-sided test.

**Primary metric:** Save rate = (cancellation attempts that do not complete cancellation in-session) / (total cancellation attempts), i.e., users who land on the screen but keep the subscription active (via primary or secondary action).

**MDE:** Baseline p1 = 0.12. Minimum detectable effect = +8pp absolute (p2 = 0.20), relative lift = +67%. Chosen because it's the largest MDE consistent with keeping the test inside ~8 weeks at this volume — see feasibility note below.

**Alpha/power:** α = 0.05 (one-sided), power = 0.80.

**Sample size (two-proportion formula):**
pbar = 0.16; 2·pbar·(1-pbar) = 0.2688, √ = 0.5185; z(0.95)=1.6449 → term1 = 0.8528
p1(1-p1)=0.1056, p2(1-p2)=0.16, sum=0.2656, √=0.5154; z(0.80)=0.8416 → term2 = 0.4337
n = (0.8528+0.4337)² / (0.08)² = 1.6551 / 0.0064 ≈ **259 per arm** (518 total).

**Duration:** 300 attempts/month ≈ 69/week total, ≈34.6/arm/week. 259 ÷ 34.6 ≈ 7.5 weeks → **run 8 weeks**, fixed horizon, no interim looks, one analysis at the end (or at n=518, whichever comes later).

**Feasibility flag:** a realistic, smaller effect (e.g., +3pp, relative +25%) would need ~2,034/arm — over 13 months at this volume, not viable. This plan only has power for a large effect. If the actual lift is smaller, extend to a pooled/rolling test (accumulate quarters) or treat this as a directional pilot and re-power once true effect size is observed.

**Guardrails:** (1) 30-day re-cancellation rate among "saved" users in each arm — catches delayed-churn masquerading as a save; (2) support tickets tagged "confused"/"tricked" post-cancellation flow; (3) pause→cancel conversion rate for users who take the pause offer.


----- ITEM I6854 (task T4) -----

## COPY

**Headline:** Your tax pot stops filling the moment you cancel.

**Body (53 words):** Cancel now and Keel stops moving money into your tax pot — you're back to guessing what you owe until the next deadline hits. Not ready to commit? Pause for 60 days at no charge; your pot and running estimate stay exactly where you left them, ready the moment you turn it back on.

**Primary (stay) action:** Keep the auto-save on

**Secondary action (offer):** Pause my plan for 60 days instead

**Confirm-cancel label:** No thanks, cancel my subscription

## TEST PLAN

- **Control (A):** current plain "Are you sure?" confirm dialog.
- **Variant (B):** save screen above.
- **Split:** 50/50, randomized per user at first cancel-click; repeat attempts by the same user stay in their original arm.
- **Primary metric:** % of cancellation attempts that end in "stayed" (user does not complete cancel), including both full stay and pause-offer takers.
- **Guardrail metrics:** (1) Day-90 net retention of "stayed" users, to confirm the pause offer delays churn rather than just deferring it; (2) support tickets mentioning billing/pause confusion.
- **Sample size:** baseline 12%. To detect a lift to ~20% stay rate (+8pp, 67% relative, a realistic bar for a well-targeted save screen) at 95% confidence / 80% power needs ~325 attempts per arm.
- **Duration:** at 300 attempts/month (150/arm/month), that's ~9–10 weeks. Run a minimum of 8 weeks; extend to 12 if the result is inconclusive rather than stopping early on a peek.
- **Decision rule:** ship B if the stay-rate lift is significant (p<0.05) and Day-90 guardrail retention isn't negative versus A.


----- ITEM I8829 (task T4) -----

## COPY

**Headline:** Keep tax money separate.

**Body:** Keel keeps moving a calculated share of client payments into your tax pot and updating your tax estimate. Less mental math. Fewer surprises. Keeping your subscription continues your current plan and price. Keel doesn’t file taxes.

**Primary stay action:** Keep my subscription

**Secondary action:** Continue to cancellation

**Confirm-cancel label:** Cancel subscription

**Offer:** None.

## TEST PLAN

- **Design:** Randomize subscribers 1:1 between the current confirmation dialog and this screen. Persist assignment; count only each subscriber’s first cancellation attempt. Keep cancellation equally accessible.
- **Assumptions:** Approximately 300 unique eligible subscribers/month; the 12% baseline holds after deduplication.
- **Primary metric:** Explicit decisions to retain the subscription during the first cancellation flow ÷ all randomized subscribers opening that flow. Abandonment does not count as a save. Verify the baseline uses this definition before launch.
- **Hypotheses:** H0: \(p_T=p_C\). H1: \(p_T\ne p_C\).
- **Preselected MDE:** **+75% relative; +9 percentage points absolute**, from 12% to 21%.
- **Error rates:** Two-sided \(\alpha=0.05\); 80% power.

With \(p_1=0.12\), \(p_2=0.21\), \(\bar p=0.165\), \(z_{1-\alpha/2}=1.96\), and \(z_{1-\beta}=0.842\):

\[
n=\frac{\left[1.96\sqrt{2(0.165)(0.835)}
+0.842\sqrt{(0.12)(0.88)+(0.21)(0.79)}\right]^2}
{(0.21-0.12)^2}
\]

\[
n\approx\frac{(1.0289+0.4387)^2}{0.0081}
\approx265.9
\Rightarrow \boxed{266\text{ subscribers per arm}}
\]

**Duration:** \(532/300=1.77\) months. Using 30.44 days/month: \(1.77\times30.44/7=7.71\) weeks. Pre-commit to **eight full weeks**, yielding approximately 552 subscribers.

**Decision:** No interim efficacy checks, early stopping, or extensions based on results. Analyze once after eight weeks; report the absolute lift and 95% confidence interval. Require a positive, statistically significant result to claim improvement. If traffic misses the required sample, report inadequate power.

**Feasibility:** This can detect only a large improvement. A 25% relative lift—12% to 15%—needs approximately 2,036 subscribers per arm, or **60 weeks**. That is impractical here. The honest alternative is this larger-MDE test; a nonsignificant result cannot rule out useful smaller gains.

**Guardrails:** Cancellation completion and time among subscribers choosing to proceed; cancellation-related complaints; refunds/chargebacks; 30-day re-cancellation and paid retention. Follow the last cohort for 30 days before the rollout decision; these checks extend observation beyond enrollment and may be imprecise.


----- ITEM I1459 (task T4) -----

## COPY

**Headline:** Cancel now, and April goes back to guessing.

**Body (51 words):** You started Keel so a client payment wouldn't quietly become money you owe. Cancel now and the tax pot stops filling — no savings, no reminders, no heads-up before the next deadline. If it's timing, pause instead: we hold off moving money and switch back on before your next quarterly due date.

**Primary ("stay") action:** Keep My Tax Pot Active

**Secondary action (offer):** Pause Instead — Free for 90 Days

**Confirm-cancel label:** No thanks, cancel my subscription

*Offer detail:* Pause freezes billing and the auto-transfer; the tax pot stays untouched and reminders resume automatically before the next quarterly deadline (or in 90 days, whichever is sooner). No discount — price is defended against the penalty, not against other apps, so cheapening it would undercut that logic.

## TEST PLAN

- **Control:** current plain "Are you sure?" confirm dialog.
- **Variant:** save screen above, 50/50 randomized at the moment "Cancel subscription" is clicked.
- **Primary metric:** save rate — % of cancellation attempts that do not end in confirmed cancellation (target: lift from 12% baseline to ≥18%).
- **Secondary metrics:** (1) pause-adoption rate among stayers, to see if the offer or the plain "keep active" click drives saves; (2) 30/60-day re-cancellation rate among stayers, to confirm this is retention, not a delayed cancel.
- **Sample size:** ~550 attempts per arm needed to detect a 12%→18% lift at 95% significance / 80% power.
- **Duration:** at ~300 attempts/month (150/arm), that's ~3.5–4 months. Run a minimum of 8 weeks before peeking, extend to ~16 weeks to hit the required n, and make sure the window spans at least one quarterly deadline (Apr 15 / Jun 15 / Sep 15 / Jan 15) since cancel intent likely spikes right after a payment — avoids a biased read from only pre- or post-deadline traffic.
- **Decision rule:** ship variant if save rate lift is statistically significant and the 60-day re-cancel rate among variant "stayers" isn't materially higher than control's.


# TASK T5

**Brief given to every writer:** Write a GOOGLE RESPONSIVE SEARCH AD for Keel targeting the keyword cluster 'freelancer quarterly taxes / estimated tax calculator self employed': 5 headlines (max 30 characters each, count them) and 2 descriptions (max 90 characters each). Then write a test plan comparing your ad vs the current control ad. Volume: 40,000 impressions/week on this cluster. Baseline: 4.1% click-through rate; of clicks, 3.0% start a trial. Say which metric you would make primary and why, and size the test for it.


----- ITEM I1695 (task T5) -----

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


----- ITEM I2498 (task T5) -----

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


----- ITEM I2087 (task T5) -----

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

**Primary metric: trial starts per impression** (overall search→trial conversion rate). Not CTR — a curiosity headline can lift CTR while pulling in the wrong searchers (e.g., calculator tourists, not freelancers with lumpy 1099 income), which the corpus flags as a real risk ( confuses scope; / punish anything that feels like "another dashboard" pitch). Trial starts per impression is the only single number that reflects both "did the headline earn a click" and "did the promise match what the click found," and it's the number tied to revenue.

**Guardrails:** CTR (flag if it drops >15% relative — protects volume/CPC) and cost-per-trial-start (flag if it rises).

**Sizing (two-sided z-test, α=0.05, power=80%):**
- Baseline overall conversion: p1 = 4.1% × 3.0% = 0.123%
- MDE: 30% relative lift (p2 ≈ 0.160%) — chosen because smaller lifts aren't worth the calendar time a low base-rate metric demands, and a copy-only change should clear a meaningful bar
- Required sample: ≈163,000 impressions per arm (≈326,000 total)
- At 20,000 impressions/arm/week: **≈8–9 weeks**

**Practical run rules:** Do one guardrail-only check at week 4 (stop early only for a severe CTR/cost blowup, never to call an early "win" — avoids peeking bias). Run the full 8–9 weeks regardless of interim significance, since freelancer payment/search behavior likely varies with pay cycles and needs multiple weeks to average out. If a faster read is needed, CTR alone reaches good power (~10% relative MDE) in ~2 weeks and can serve as an early directional signal — but the decision to ship is made on trial starts per impression, not CTR.


----- ITEM I6746 (task T5) -----

## COPY

Character counts include spaces and punctuation.

| Label | Copy | Characters |
|---|---|---:|
| H1 | Freelancer Quarterly Taxes | 26/30 |
| H2 | See Your Estimated Tax | 22/30 |
| H3 | Tax Money, Set Aside | 20/30 |
| H4 | Skip the Tax Mental Math | 24/30 |
| H5 | Start Your Free 14-Day Trial | 28/30 |
| D1 | Client paid? Keel moves a calculated share to a tax pot and keeps a running tax estimate. | 89/90 |
| D2 | 14 days free. No card needed. Then $12/mo. Connect via Plaid. Keel doesn't file taxes. | 86/90 |

## TEST PLAN

**Primary metric:** attributed trial starts ÷ ad impressions. Count each new trial once, within seven days of its ad click. This captures both attracting clicks and converting them; CTR alone can reward curiosity without customer acquisition.

**Design:** Randomize eligible traffic 50/50 between the unchanged control and this RSA. Hold targeting, bids, budget constraints, landing page and conversion tracking constant. Test the whole asset bundle; results cannot establish individual headline effects.

Assume 40,000 eligible impressions weekly, stable baseline rates, approximately independent impression outcomes and sufficient budget.

- **Baseline:** \(p_1=0.041\times0.03=0.00123\), or **0.123%**.
- **Pre-chosen MDE:** **40% relative**, or **0.0492 percentage points absolute**; \(p_2=0.001722\), or **0.1722%**.
- **H0:** \(p_{\text{new}}=p_{\text{control}}\).
- **H1:** \(p_{\text{new}}\ne p_{\text{control}}\). Declare a conversion win only for a significant increase.
- **Alpha:** 0.05, two-sided; **power:** 80%.
- \(z_{1-\alpha/2}=1.96\), \(z_{1-\beta}=0.8416\); \(\bar p=0.001476\).

Per-arm sample size:

\[
n=\frac{\left[z_{1-\alpha/2}\sqrt{2\bar p(1-\bar p)}
+z_{1-\beta}\sqrt{p_1(1-p_1)+p_2(1-p_2)}\right]^2}{(p_2-p_1)^2}
\]

\[
=\frac{\left[1.96\sqrt{2(0.001476)(0.998524)}
+0.8416\sqrt{(0.00123)(0.99877)+(0.001722)(0.998278)}\right]^2}
{(0.000492)^2}
=95{,}576.6
\]

**Required:** 95,577 impressions per arm. At 20,000 per arm weekly, \(95{,}577/20{,}000=4.78\) weeks: **five full weeks**, approximately 100,000 impressions per arm.

**Fixed horizon:** Stop enrollment after five weeks; wait seven additional days for attribution to mature. No interim significance checks, early stopping or outcome-driven extensions. Report the effect and 95% confidence interval; nonsignificance does not establish equivalence.

**Feasibility:** A 20% relative lift requires approximately **350,494 impressions per arm—18 weeks**. That is impractical here. The larger 40% MDE makes this a feasible test for substantial gains, with limited ability to detect modest improvements.

**Guardrails:** cost per trial, bank-connection completion per trial and trial-to-paid conversion. Track CTR and click-to-trial conversion diagnostically. Allow downstream cohorts to mature before rollout; sparse guardrail data remain inconclusive.


## Output
Return ONLY a JSON array, no prose, no code fence. One object per item, every item exactly once:
[{"id":"I1234","D1":7,"D2":6,"D3":8,"D4":6,"note":"<= 20 words: the main reason"}]
Use the full 1-10 range; differentiate items within a task.