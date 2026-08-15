---
date: 2026-08-15
role: ceo
task: docs-cold-start-findings
tier: trivial
qa_verdict: PASS
---

Documentation only; no code. Records **#50 as RESOLVED** in PHASE-8A-STATUS.md and adds four rules to the handoff, all earned by measurement rather than reasoning.

**#50's two causes, both CONFIRMED.** Corpus growth — `buildCold` reads every transcript with no sampling and no early exit, 3.03 GB / 2,535 files, linear at ~1.5 GB/s, and the corpus went 1.01 → 3.03 GB in 21 days, moving the floor ~700 → ~2,050 ms. OS memory reclaim, not load — r(ms,pageins)=0.915, verified causally by evicting 8 GB (2,154 → 4,406 ms) against a 0 GB control at ratio 0.87, with partial correlations separating it from load (0.864 vs 0.491). **A bounded negative on the rest:** 12,610 ms was not reproduced; it needs ~0.24 GB/s, 2.5× worse than anything inducible, eviction plateaus at ~4.4 s, and zero swapouts occurred across 30+ builds — leaving swap as the live candidate.

**Two CEO errors corrected by that investigation.** "Corpus growth disproved, ~4× headroom" was wrong and "neither proved nor disproved" was too weak — it is a confirmed cause with a rate. And the anti-correlation a whole paragraph rested on, *"the quieter machine was five times slower"*, is explained by r(load, rep index)=0.889: the measurer's own repeated runs warmed the machine, so an artefact of measurement order was read as evidence.

**Two candidate designs were built and measured, and both failed** — the repo's own `stallGateVerdict` control-ratio shape gave an 8.58× ratio spread against a 1.90× raw spread, and a fixed-slice rate spanned 2.07× across sessions. The constraint they prove is now a handoff rule: *any assertion tight enough to catch a 2× code regression will also fire on machine state; any loose enough to survive machine state cannot catch 2×* — and the 10 s line sat **inside** the 2.1–12.6 s spread.

Four rules added: **calibrate against the subject, not its neighbour** (3,000 ms/GB was defensible for `buildCold` and inside the noise band for the route actually asserted on); **a clock-based assertion inherits everything the clock is exposed to** (#43b at subject scale, #50 at machine scale, same escape); **the repo's own best pattern does not always transfer** — "we already have a pattern for this" is not a measurement; and **when you decline a change, record the bar for revisiting it**, since a warn that fails nothing reads as unfinished and "it fired again" is the wrong bar.

Verification: `npm run check` **exit 0**, `bun test` **228 pass / 0 fail** at load 3.73→2.83 on `3fbbb32`. Classifier floor `trivial`. No independent review — documentation of measurements each already executed and independently reviewed in their own PRs.
