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

## RATIONALE

- Headline: reactivates the surprise/not-knowing dread (Q6, Q7, Q14, Q18) — loss aversion: cancelling removes the one thing that already resolved the ambiguity.
- Body "sitting safe in your tax pot… back to mental math": mental accounting (Q2, Q3) — losing the pot means income becomes "spendable" again, an explicit loss.
- Pause offer, not a discount: matches anti-effort/anti-dashboard demand (Q4, Q10, Q19) and preserves the penalty-vs-price frame (Q11, Q20) that a price cut would undercut.
- Confirm-cancel kept plain, no guilt language: consistent with "doesn't make me feel stupid" (Q5).