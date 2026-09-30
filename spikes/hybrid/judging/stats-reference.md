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

