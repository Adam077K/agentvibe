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

## RATIONALE

- Subject A → Q6/Q18: dread is the *not-knowing*; ambiguity aversion, not loss aversion, is the lever.
- Subject B → Q12: naming "encrypted, read-only" pre-empts the security objection before it blocks action (fear reduction via specificity).
- Preheader → Q4/Q19: "no dashboard" matches their stated anti-effort stance; reduces perceived effort cost.
- Opening line → Q1/Q15: present bias — inaction today silently becomes April's surprise; makes the cost of delay concrete.
- Security paragraph → Q12: specific mechanics ("can't move money out") counter the vague fear directly.
- "Set aside automatically" → Q3/Q4: mental accounting ("not real money") plus a commitment device — action happens without ongoing willpower.