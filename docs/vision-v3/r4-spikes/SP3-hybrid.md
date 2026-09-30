# SP3: does a hybrid specialty beat a classic role on a real task?

**Verdict: PASS, but only just.** Every pre-registered criterion is met. The headline effect is Δ = +1.01 against a
+1.0 bar. The effect is real and sits outside the noise. It is concentrated in the test-plan statistics. It is
**zero on pure copy** (T1). This spike did **not** separate "hybrid identity" from "longer, more procedural
prompt", so this result does not yet show that the hybrid title itself adds anything.

## 1. Hypothesis and pre-registered criteria

The idea under test: an AI-native fused specialty beats a classic human job title. The hybrid here is the
**Conversion Scientist**: direct-response copy, experimental statistics, behavioural economics and the venture's
customer-language corpus in one identity. The classic role is the **Conversion Copywriter**. The hybrid has to win
on the same task with **identical inputs**, in both model families, by more than run-to-run noise.

The criteria were written into `spikes/hybrid/PREREG.md` and committed (`6ab2a8a`) before any worker was
launched:
- **PASS** requires all five of these:
  - Δ (mean of hybrid − classic over 10 task×model pairs, composite 1–10) ≥ +1.0
  - the lower bound of the 95% bootstrap CI is above 0
  - Δ is larger than N, the generation-noise floor measured on replicate runs
  - Δ is above 0 in each model family
  - Δ on D4 (likely conversion) is at least +0.5
- **FAIL** if the CI includes 0, or Δ < 0.5, or Δ ≤ N.
- **PARTIAL** for anything else.
- **Rubric-alignment cap**: if the hybrid won D1 and D3 but not D4, the verdict could be no better than PARTIAL.
  D1 and D3 are the dimensions its prompt names explicitly, so a win there alone could just be instruction-following.

## 2. Setup

All files are under `spikes/hybrid/`:

| File | What |
|---|---|
| `identities/classic.json`, `hybrid.json` | Identity records: title, expertise, skills, system prompt. No personal names. |
| `corpus/customer-quotes.md` | Fictional product **Keel**, which sets aside quarterly tax money for US freelancers. 20 customer quotes (interviews, support tickets, reviews). |
| `tasks/tasks.json` | 5 tasks. Each asks for copy plus an A/B test plan sized to a given traffic level. T1 landing hero (9k visitors/wk, 3.2%). T2 pricing page with an annual-default test (2.4k/wk, 6%). T3 activation email (990 recipients/wk, 41%). T4 cancel-save screen (69 attempts/wk, 12%, **deliberately underpowered**). T5 search ad (CTR vs downstream conversion). |
| `stats-reference.mjs` → `judging/stats-reference.md` | Computed answer key for the per-arm sample size at each MDE, so judges grade the maths against computed numbers. |
| `generate.mjs`, `judge.mjs`, `analyze.mjs`, `lib.mjs` | Launcher (CSV-logged), blinding plus judging, and the pre-registered analysis. |

**How the arms were run.**
- **Inputs:** both identities got the same brief and the full corpus. Only the identity record differed.
- **Workers:** Claude ran `claude-sonnet-5` headless with no tools and the identity as system prompt. Codex ran
  `gpt-6-astra` via `codex exec -s read-only` in an empty directory, with the identity prepended to the prompt.
- **Runs:** 20 primary outputs, plus a second run of T1 and T4 in all 4 arms (8 replicates).

**How the judging worked.**
- Judges saw only the `COPY` and `TEST PLAN` sections. `RATIONALE`, quote IDs and role titles were stripped.
- Items got random IDs and were shuffled within each task.
- Cross-family rule: Codex judged all Claude items (X-codex) and `claude-opus-5` judged all Codex items (X-claude).
- On top of that, one extra judge per family scored everything: E-claude (`sonnet-5`) and E-codex.
- Both extra judges were run a second time with a new shuffle, to measure judge noise.
- Each item's score is the mean of 3 judges (1 cross-family, 2 extra) over D1–D4.

**Budget:** 34 of 40 launches, all exit 0. Reported Claude cost was **$15.95**. Mean wall time was 72s for Claude
generation, 55s for Codex generation, 290s for a Claude judge and 130s for a Codex judge. Raw log:
`logs/launches.csv`.

## 3. What happened

**Primary pairs** (item score = mean of 3 judges; Δ columns are hybrid − classic):

| Task | Model | Hybrid | Classic | Δ | ΔD1 lang | ΔD2 spec | ΔD3 stats | ΔD4 conv |
|---|---|---|---|---|---|---|---|---|
| T1 hero | claude | 7.25 | 7.33 | **−0.08** | −0.33 | −1.33 | +1.67 | −0.33 |
| T1 hero | codex | 7.67 | 7.58 | **+0.08** | +0.67 | −0.67 | +0.33 | 0.00 |
| T2 pricing | claude | 7.92 | 6.25 | +1.67 | +1.67 | +1.67 | +0.67 | +2.67 |
| T2 pricing | codex | 8.50 | 7.42 | +1.08 | +0.67 | +1.00 | +1.67 | +1.00 |
| T3 email | claude | 7.17 | 5.83 | +1.33 | +1.67 | +0.67 | +1.67 | +1.33 |
| T3 email | codex | 9.25 | 7.33 | +1.92 | +1.67 | +1.67 | +2.67 | +1.67 |
| T4 cancel | claude | 6.58 | 5.75 | +0.83 | +0.67 | +0.33 | +2.67 | −0.33 |
| T4 cancel | codex | 7.67 | 6.75 | +0.92 | +0.67 | +0.33 | +2.33 | +0.33 |
| T5 ad | claude | 8.00 | 6.83 | +1.17 | +1.33 | +0.67 | +1.00 | +1.67 |
| T5 ad | codex | 8.25 | 7.08 | +1.17 | +1.00 | +1.00 | +2.00 | +0.67 |

**Aggregate results:**
- **Δ = +1.01**, 95% CI [+0.63, +1.37]. The hybrid won 9 of 10 pairs. Cohen's d_z = 1.62.
- **Generation-noise floor N = 0.53.** This is the mean absolute difference between two runs of the same arm.
  Individual replicate pairs ranged from 0.17 to 1.17, so a single-pair difference of about 1 point is ordinary.
- Δ is 1.9× N. It is outside the noise **for the mean of 10 pairs**, and **inside the noise for any single task**.
- **Replicate-averaged Δ on T1 and T4 was only +0.57.** Where both runs exist, averaging them roughly halves the
  hybrid's edge on those two tasks.
- **By family:** Claude +0.98, Codex +1.03.
- **By dimension:** D1 +0.97, D2 +0.53, **D3 +1.67**, D4 +0.87. The statistics dimension carries the most weight.
  The D4 gate (≥ +0.5) passes.
- **By judge:** every judge found Δ > 0. X-codex +1.05, X-claude +0.95, E-claude +1.30, E-codex +0.73.
  E-claude and E-codex agree on the sign of 8 of 10 pairs.

**Findings on the judges themselves (the most transferable numbers here):**
- **Each family strongly prefers its own outputs.**
  - E-claude averaged 8.09 on Claude items and 7.00 on Codex items (**+1.1 self-preference**).
  - E-codex averaged 5.75 on Claude items and 8.95 on Codex items (**+3.2**).
  - Across items, the two families' composite scores correlate at **r = −0.37**.
- **Absolute scores are therefore meaningless across families.** The spike holds up only because every
  comparison is paired within one generating model.
- **Judge noise on a re-run with a new shuffle:** mean absolute item difference was 0.61 for Claude and 0.28 for
  Codex. The re-run's Δ was 1.25 for Claude and 0.63 for Codex, so the direction held.

**Notable transcripts:**
- **T1 (pure copy), no effect.** The classic Claude headline was *"Your tax money, gone before you spend it."*
  The hybrid wrote *"Never Be Surprised By A Tax Bill Again"*. It mined the right pain (surprise, from Q6 and Q18)
  but landed on a cliché. On the hero alone the classic role is as good or better.
- **T4 (underpowered trap), where the hybrid earns its edge.** The hybrid Codex output said plainly that a 25%
  lift needs about 2,036 per arm, about 60 weeks. It pre-committed a large MDE (12%→21%, 266 per arm, 8 weeks)
  with no peeking. The classic Codex plan understated the sample needed (X-claude: *"660 total … understates need"*).
- **A hybrid failure that the judges split on.** The hybrid Claude cancel screen says *"One underpayment penalty
  typically costs more than a full year of Keel."* The corpus does not support that claim.
  - E-claude scored it 9/9/9/9.
  - E-codex scored it 6/4/6/2: *"unsupported typical-penalty … claims pressure users"*.
  - Behavioural-economics framing pushed the hybrid toward fear-based, unsourced copy, and only the cross-family
    judge caught it.
- **Length.** After blinding, hybrid outputs were 39% longer (2,523 vs 1,819 bytes). The length ratio does
  **not** predict the win (r = −0.19), so length bias does not explain the result.

## 4. Verdict against §1

| Criterion | Needed | Got | Met |
|---|---|---|---|
| Δ | ≥ +1.0 | +1.01 | yes, by 0.01 |
| CI lower bound | > 0 | +0.63 | yes |
| Δ > N | > 0.53 | 1.01 | yes |
| Δ > 0 in both families | both | +0.98 / +1.03 | yes |
| ΔD4 | ≥ +0.5 | +0.87 | yes (the rubric-alignment cap does not bind) |

**PASS.** It should be read as a narrow pass:
- The Δ threshold was cleared by 0.01.
- The effect disappears on pure copy.
- The replicate-averaged Δ is lower.
- What passed is the **whole identity record**, which is longer and procedural. The title alone was not tested.

## 5. What this changes in the v3 design

1. **Keep hybrid specialties, and define them as fused procedures rather than titles.** The measured edge comes
   from things the hybrid *does*: it checks power against traffic, admits infeasibility, and mines the corpus. An
   identity record should carry its procedure and a pre-registered claim ("beats <classic> on <task class> by ≥X").
   It earns a place on the roster only through a paired test like this one.
2. **Route by task class.** Send hybrids to work that mixes copy and measurement (pricing, lifecycle, retention,
   paid acquisition). Pure copy (heroes, headlines) showed no gain, so do not pay the hybrid's 39% extra length and
   latency there.
3. **The Referee compares within one generator, never across generators.** A judge's family bias (+1.1 and +3.2)
   is larger than the effect being measured. Absolute cross-family scores must never rank agents. Keep the
   cross-family rule mandatory: it caught the unsourced penalty claim that the same-family judge scored 9/10.
4. **Make statistics a deterministic check, not only a trait.** D3 carried the largest share of the effect, and a
   ~40-line script produced its answer key. Put a power and duration calculator in the evidence ladder, as a tool
   any identity can call and the Referee re-computes. Part of the hybrid's advantage then becomes a floor for
   every agent. Part 6 below asks whether any advantage remains after that.
5. **Add an evidence-sourcing lens to customer-facing copy.** Hybrid behavioural framing produced a claim the
   corpus does not support. Copy claims should be checked against the Venture Mind's corpus, the same way the
   claim ledger checks citations.
6. **Size identity A/B tests at ≥10 paired items with replicates.** Single-task generation noise (up to 1.17)
   matches the effect size. A one-task bake-off between identities cannot be read.

## 6. What we still don't know

- **Title versus procedure.** The next spike needs two more arms:
  - the classic title given the hybrid's statistics and corpus checklist;
  - the hybrid title given the classic's short prompt.
  If the first matches the hybrid, the unit of design is the procedure and titles are labels. This is the single
  most important open question.
- **Real conversion.** D4 is an LLM forecast, the lowest rung of the evidence ladder. No live traffic was used.
- **Generality.** One fictional product, 5 tasks, and one draw of the corpus. The judges also had a computed
  answer key. Without it, D3 grading might be noisier and the hybrid's statistics edge harder to see.
- **Whether the hybrid's fear-framing tendency is systematic.** One instance is known, and nothing here measured
  how often it happens.

Artifacts: `spikes/hybrid/outputs/` (28 outputs), `judging/` (prompts, keys, raw scores), `results.json`,
`logs/launches.csv`.
