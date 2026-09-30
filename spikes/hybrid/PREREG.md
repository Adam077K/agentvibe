# SP3 pre-registration — written and committed BEFORE any worker launch

## Hypothesis (falsifiable)
An AI-native hybrid-specialty identity ("Conversion Scientist": direct-response copy + experimental statistics +
behavioural economics + the venture's own customer-language corpus) produces **measurably better** conversion
work than a classic-role identity ("Conversion Copywriter") on the same task, **with the same inputs**, in
**both** model families (Claude, Codex), by a margin larger than run-to-run noise.

## Design
- 2 identities × 2 models × 5 tasks = 20 primary outputs. Identity records in `identities/`.
- **Inputs are identical for both identities**: the brief, the product description and the full 20-quote corpus
  are given to BOTH. Only the identity record (title, expertise, system prompt, skills list) differs. This
  isolates identity from context. (Giving the corpus only to the hybrid would test context, not identity.)
- Replicates: T1 and T4, all 4 arms, run a second time (8 outputs) → generation noise floor.
- Models: Claude `claude-sonnet-5` (headless `claude -p`, no tools, no settings sources); Codex `gpt-6-astra`
  (`codex exec -s read-only` in an empty dir).
- Same output schema for both identities: `## COPY`, `## TEST PLAN`, optional `## RATIONALE`. Judges see COPY and
  TEST PLAN only; RATIONALE and any quote-ID tokens (`Q\d+`) and role titles are stripped (blinding).

## Judging (blind, cross-family)
- Items get random IDs; order shuffled within each task; model and identity hidden.
- **J-X-codex**: Codex judges all Claude-generated items. **J-X-claude**: `claude-opus-5` judges all Codex-generated
  items. (Cross-family rule.)
- **J-E-claude** (`claude-sonnet-5`) and **J-E-codex** (`gpt-6-astra`): each judges ALL items. (Extra judge per family.)
- **Judge-noise check**: J-E-claude and J-E-codex re-run once with a different shuffle and new IDs.
- Rubric, each 1–10 with anchors (`judging/rubric.md`): D1 customer-language fidelity, D2 specificity,
  D3 statistical correctness (graded against the computed key `judging/stats-reference.md`),
  D4 likely conversion. Composite = mean(D1..D4).

## Metrics
- Item score = mean over its primary judges (3 per item: 1 cross + 2 extra) of the composite. Repeat-judge runs
  are used only for the judge-noise estimate.
- **Δ** = mean over the 10 primary (task × model) pairs of hybrid − classic item score (primary run only).
- **CI**: 95% percentile bootstrap over the 10 pairs (10,000 resamples, seed 42).
- **N (generation noise floor)** = mean |score(run1) − score(run2)| over the 8 replicate pairs (same identity,
  same model, same task).
- Effect size also reported as Cohen's d_z (mean of pair differences / SD of pair differences).

## Pass criteria (fixed now)
- **PASS** — all of: Δ ≥ +1.0 composite points; CI lower bound > 0; Δ > N; Δ > 0 within each model family;
  hybrid ≥ classic on D4 (likely conversion) by ≥ +0.5, averaged over pairs.
- **FAIL** — any of: CI includes 0; Δ < +0.5; Δ ≤ N.
- **PARTIAL** — everything else (e.g. real but < +1.0; one family only; or the win is confined to D1/D3).
- **Rubric-alignment cap**: D1 (customer language) and D3 (statistics) are dimensions the hybrid prompt explicitly
  names — a win there could be instruction-following against a rubric it was told about. If the hybrid does not
  also win D4 by ≥ +0.5, the verdict is capped at PARTIAL whatever Δ is.

## Budget
40 worker launches max; ~$25 reported Claude cost max. Planned: 28 generation + 6 judge = 34. Every launch is
logged to `logs/launches.csv`.
