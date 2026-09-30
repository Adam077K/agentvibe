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
